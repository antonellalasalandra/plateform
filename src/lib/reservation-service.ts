import type { Prisma, ReservationStatus } from "@prisma/client";
import { z } from "zod";
import {
  addMinutes,
  computeAvailability,
  dateTimeFromParts,
  type AvailabilityBlockedSlot,
  type AvailabilityCombination,
  type AvailabilityReservation,
  type AvailabilityShift,
  type AvailabilityTable
} from "@/lib/availability-engine";
import { ApiError, addMinutesToTime, parseDateOnly } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  party_size: z.coerce.number().int().min(1).max(40),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional()
});

export const createReservationSchema = z.object({
  customer_name: z.string().min(2),
  customer_phone: z.string().min(3),
  customer_email: z.string().email().optional().or(z.literal("")),
  party_size: z.coerce.number().int().min(1).max(40),
  reservation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  source: z.enum(["website", "phone", "walkin", "admin", "import"]).default("phone"),
  notes: z.string().optional(),
  table_ids: z.array(z.string()).optional()
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export async function getAvailabilityForRestaurant({
  restaurantId,
  tenantId,
  date,
  partySize,
  preferredTime
}: {
  restaurantId: string;
  tenantId: string;
  date: string;
  partySize: number;
  preferredTime?: string;
}) {
  const [tables, combinations, shifts, reservations, blockedSlots] = await Promise.all([
    prisma.restaurantTable.findMany({
      where: { tenantId, restaurantId, isActive: true },
      orderBy: [{ seatsMax: "asc" }, { name: "asc" }]
    }),
    prisma.tableCombination.findMany({
      where: { tenantId, restaurantId, isActive: true },
      include: { items: true }
    }),
    prisma.serviceShift.findMany({
      where: { tenantId, restaurantId, isActive: true },
      orderBy: { startTime: "asc" }
    }),
    prisma.reservation.findMany({
      where: {
        tenantId,
        restaurantId,
        reservationDate: parseDateOnly(date),
        status: { in: ["pending", "confirmed", "seated"] }
      },
      include: { tables: true }
    }),
    prisma.blockedSlot.findMany({
      where: {
        tenantId,
        restaurantId,
        startDatetime: { lt: new Date(`${date}T23:59:59`) },
        endDatetime: { gt: new Date(`${date}T00:00:00`) }
      }
    })
  ]);

  return computeAvailability({
    date,
    partySize,
    preferredTime,
    tables: tables.map(mapTable),
    combinations: combinations.map(mapCombination),
    shifts: shifts.map(mapShift),
    reservations: reservations.map(mapReservation),
    blockedSlots: blockedSlots.map(mapBlockedSlot),
    bufferMinutes: 10,
    weekendExtraMinutes: 15
  });
}

export async function createReservationWithAvailabilityLock({
  tenantId,
  restaurantId,
  input
}: {
  tenantId: string;
  restaurantId: string;
  input: CreateReservationInput;
}) {
  return prisma.$transaction(async (tx) => {
    const lockKey = `${tenantId}:${restaurantId}:${input.reservation_date}:${input.start_time}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const endTime = addMinutesToTime(input.start_time, input.party_size <= 2 ? 90 : input.party_size <= 4 ? 105 : 120);
    const tableIds =
      input.table_ids && input.table_ids.length > 0
        ? input.table_ids
        : await pickTablesInsideTransaction(tx, {
            tenantId,
            restaurantId,
            date: input.reservation_date,
            partySize: input.party_size,
            preferredTime: input.start_time
          });

    if (tableIds.length === 0) {
      throw new ApiError("No compatible table available for the requested slot", 409);
    }

    await assertTablesAreStillFree(tx, {
      tenantId,
      restaurantId,
      date: input.reservation_date,
      startTime: input.start_time,
      endTime,
      tableIds
    });

    const customer = await tx.customer.upsert({
      where: {
        tenantId_restaurantId_phone: {
          tenantId,
          restaurantId,
          phone: input.customer_phone
        }
      },
      create: {
        tenantId,
        restaurantId,
        phone: input.customer_phone,
        email: normalizeEmail(input.customer_email),
        firstName: input.customer_name
      },
      update: {
        email: normalizeEmail(input.customer_email),
        firstName: input.customer_name
      }
    });

    const reservation = await tx.reservation.create({
      data: {
        tenantId,
        restaurantId,
        customerId: customer.id,
        customerName: input.customer_name,
        customerPhone: input.customer_phone,
        customerEmail: normalizeEmail(input.customer_email),
        partySize: input.party_size,
        reservationDate: parseDateOnly(input.reservation_date),
        startTime: input.start_time,
        endTime,
        source: input.source,
        status: input.source === "walkin" ? "seated" : "confirmed",
        notes: input.notes,
        tables: {
          create: tableIds.map((tableId) => ({ tableId }))
        }
      },
      include: { tables: { include: { table: true } } }
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        restaurantId,
        action: input.source === "walkin" ? "walkin.created" : "reservation.created",
        entityType: "reservation",
        entityId: reservation.id,
        newValue: {
          id: reservation.id,
          customer_name: reservation.customerName,
          party_size: reservation.partySize,
          reservation_date: input.reservation_date,
          start_time: reservation.startTime,
          table_ids: tableIds,
          source: reservation.source,
          status: reservation.status
        }
      }
    });

    return reservation;
  });
}

export function reservationToApi(row: Awaited<ReturnType<typeof createReservationWithAvailabilityLock>>) {
  return {
    id: row.id,
    customer_name: row.customerName,
    customer_phone: row.customerPhone,
    customer_email: row.customerEmail,
    party_size: row.partySize,
    reservation_date: row.reservationDate.toISOString().slice(0, 10),
    start_time: row.startTime,
    end_time: row.endTime,
    source: row.source,
    status: row.status,
    table_names: row.tables.map((link) => link.table.name)
  };
}

async function pickTablesInsideTransaction(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    restaurantId: string;
    date: string;
    partySize: number;
    preferredTime: string;
  }
) {
  const [tables, combinations, shifts, reservations, blockedSlots] = await Promise.all([
    tx.restaurantTable.findMany({
      where: { tenantId: input.tenantId, restaurantId: input.restaurantId, isActive: true },
      orderBy: [{ seatsMax: "asc" }, { name: "asc" }]
    }),
    tx.tableCombination.findMany({
      where: { tenantId: input.tenantId, restaurantId: input.restaurantId, isActive: true },
      include: { items: true }
    }),
    tx.serviceShift.findMany({
      where: { tenantId: input.tenantId, restaurantId: input.restaurantId, isActive: true },
      orderBy: { startTime: "asc" }
    }),
    tx.reservation.findMany({
      where: {
        tenantId: input.tenantId,
        restaurantId: input.restaurantId,
        reservationDate: parseDateOnly(input.date),
        status: { in: ["pending", "confirmed", "seated"] }
      },
      include: { tables: true }
    }),
    tx.blockedSlot.findMany({
      where: {
        tenantId: input.tenantId,
        restaurantId: input.restaurantId,
        startDatetime: { lt: new Date(`${input.date}T23:59:59`) },
        endDatetime: { gt: new Date(`${input.date}T00:00:00`) }
      }
    })
  ]);

  const result = computeAvailability({
    date: input.date,
    partySize: input.partySize,
    preferredTime: input.preferredTime,
    tables: tables.map(mapTable),
    combinations: combinations.map(mapCombination),
    shifts: shifts.map(mapShift),
    reservations: reservations.map(mapReservation),
    blockedSlots: blockedSlots.map(mapBlockedSlot)
  });

  return result.slots[0]?.suggestedTables ?? [];
}

async function assertTablesAreStillFree(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    restaurantId: string;
    date: string;
    startTime: string;
    endTime: string;
    tableIds: string[];
  }
) {
  const start = dateTimeFromParts(input.date, input.startTime);
  const end = dateTimeFromParts(input.date, input.endTime);
  const conflicts = await tx.reservation.findMany({
    where: {
      tenantId: input.tenantId,
      restaurantId: input.restaurantId,
      reservationDate: parseDateOnly(input.date),
      status: { in: ["pending", "confirmed", "seated"] },
      tables: { some: { tableId: { in: input.tableIds } } }
    },
    include: { tables: true }
  });

  const hasOverlap = conflicts.some((reservation) =>
    reservation.tables.some((link) => input.tableIds.includes(link.tableId)) &&
    overlapsWithBuffer(start, end, dateTimeFromParts(input.date, reservation.startTime), dateTimeFromParts(input.date, reservation.endTime))
  );

  if (hasOverlap) {
    throw new ApiError("Requested table is no longer available", 409);
  }
}

function mapTable(table: {
  id: string;
  name: string;
  seatsMin: number;
  seatsMax: number;
  status: AvailabilityTable["status"];
  isActive: boolean;
}): AvailabilityTable {
  return {
    id: table.id,
    name: table.name,
    seatsMin: table.seatsMin,
    seatsMax: table.seatsMax,
    status: table.status,
    isActive: table.isActive
  };
}

function mapCombination(combination: {
  id: string;
  name: string;
  totalSeatsMin: number;
  totalSeatsMax: number;
  isActive: boolean;
  items: { tableId: string }[];
}): AvailabilityCombination {
  return {
    id: combination.id,
    name: combination.name,
    tableIds: combination.items.map((item) => item.tableId),
    totalSeatsMin: combination.totalSeatsMin,
    totalSeatsMax: combination.totalSeatsMax,
    isActive: combination.isActive
  };
}

function mapShift(shift: {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  defaultDurationMinutes: number;
  slotIntervalMinutes: number;
  isActive: boolean;
}): AvailabilityShift {
  return shift;
}

function mapReservation(reservation: {
  id: string;
  reservationDate: Date;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  tables: { tableId: string }[];
}): AvailabilityReservation {
  const date = reservation.reservationDate.toISOString().slice(0, 10);

  return {
    id: reservation.id,
    start: dateTimeFromParts(date, reservation.startTime),
    end: dateTimeFromParts(date, reservation.endTime),
    tableIds: reservation.tables.map((table) => table.tableId),
    status: reservation.status
  };
}

function mapBlockedSlot(slot: { startDatetime: Date; endDatetime: Date }): AvailabilityBlockedSlot {
  return {
    start: slot.startDatetime,
    end: slot.endDatetime
  };
}

function normalizeEmail(value?: string) {
  return value && value.length > 0 ? value : undefined;
}

function overlapsWithBuffer(start: Date, end: Date, otherStart: Date, otherEnd: Date) {
  const bufferedStart = addMinutes(start, -10);
  const bufferedEnd = addMinutes(end, 10);
  return bufferedStart < otherEnd && otherStart < bufferedEnd;
}
