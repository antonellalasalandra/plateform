import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createReservationSchema,
  createReservationWithAvailabilityLock,
  reservationToApi
} from "@/lib/reservation-service";
import { getRestaurantContext, jsonError, parseDateOnly, restaurantParamsSchema } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const listQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["pending", "confirmed", "seated", "completed", "cancelled", "no_show"]).optional(),
  q: z.string().optional()
});

export async function GET(request: Request, context: { params: Promise<{ restaurantId: string }> }) {
  try {
    const params = restaurantParamsSchema.parse(await context.params);
    const query = listQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const restaurant = await getRestaurantContext(params.restaurantId);
    const reservations = await prisma.reservation.findMany({
      where: {
        tenantId: restaurant.tenantId,
        restaurantId: restaurant.id,
        reservationDate: query.date ? parseDateOnly(query.date) : undefined,
        status: query.status,
        OR: query.q
          ? [
              { customerName: { contains: query.q, mode: "insensitive" } },
              { customerPhone: { contains: query.q, mode: "insensitive" } }
            ]
          : undefined
      },
      include: { tables: { include: { table: true } } },
      orderBy: [{ reservationDate: "asc" }, { startTime: "asc" }]
    });

    return NextResponse.json({
      reservations: reservations.map((reservation) => ({
        id: reservation.id,
        customer_name: reservation.customerName,
        customer_phone: reservation.customerPhone,
        customer_email: reservation.customerEmail,
        party_size: reservation.partySize,
        reservation_date: reservation.reservationDate.toISOString().slice(0, 10),
        start_time: reservation.startTime,
        end_time: reservation.endTime,
        status: reservation.status,
        source: reservation.source,
        table_names: reservation.tables.map((link) => link.table.name)
      }))
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ restaurantId: string }> }) {
  try {
    const params = restaurantParamsSchema.parse(await context.params);
    const restaurant = await getRestaurantContext(params.restaurantId);
    const payload = createReservationSchema.parse(await request.json());
    const reservation = await createReservationWithAvailabilityLock({
      tenantId: restaurant.tenantId,
      restaurantId: restaurant.id,
      input: payload
    });

    return NextResponse.json({ reservation: reservationToApi(reservation) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
