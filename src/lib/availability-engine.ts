export type AvailabilityTable = {
  id: string;
  name: string;
  seatsMin: number;
  seatsMax: number;
  status: "available" | "occupied" | "reserved" | "blocked" | "maintenance";
  isActive: boolean;
};

export type AvailabilityCombination = {
  id: string;
  name: string;
  tableIds: string[];
  totalSeatsMin: number;
  totalSeatsMax: number;
  isActive: boolean;
};

export type AvailabilityReservation = {
  id: string;
  start: Date;
  end: Date;
  tableIds: string[];
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";
};

export type AvailabilityShift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  defaultDurationMinutes: number;
  slotIntervalMinutes: number;
  isActive: boolean;
};

export type AvailabilityBlockedSlot = {
  start: Date;
  end: Date;
};

export type AvailabilityInput = {
  date: string;
  partySize: number;
  preferredTime?: string;
  tables: AvailabilityTable[];
  combinations: AvailabilityCombination[];
  reservations: AvailabilityReservation[];
  shifts: AvailabilityShift[];
  blockedSlots: AvailabilityBlockedSlot[];
  bufferMinutes?: number;
  weekendExtraMinutes?: number;
};

export type AvailabilitySlot = {
  time: string;
  available: boolean;
  suggestedTables: string[];
  capacityLeft: number;
  reason?: string;
};

export type AvailabilityResult = {
  available: boolean;
  slots: AvailabilitySlot[];
};

const ACTIVE_RESERVATION_STATUSES = new Set(["pending", "confirmed", "seated"]);

export function computeAvailability(input: AvailabilityInput): AvailabilityResult {
  const slots = buildCandidateSlots(input).map((time) => {
    const start = dateTimeFromParts(input.date, time);
    const duration = getDurationMinutes(input.partySize, start, input);
    const end = addMinutes(start, duration);
    const shift = input.shifts.find((candidateShift) =>
      isTimeInsideShift(formatTime(start), candidateShift.startTime, candidateShift.endTime)
    );

    if (!shift || end > dateTimeFromParts(input.date, shift.endTime)) {
      return emptySlot(time, "outside_shift");
    }

    if (input.blockedSlots.some((blocked) => overlaps(start, end, blocked.start, blocked.end))) {
      return emptySlot(time, "blocked");
    }

    const candidate = findBestCandidate({
      partySize: input.partySize,
      start,
      end,
      tables: input.tables,
      combinations: input.combinations,
      reservations: input.reservations,
      bufferMinutes: input.bufferMinutes ?? 10
    });

    if (!candidate) {
      return emptySlot(time, "full");
    }

    const capacityLeft = computeCapacityLeft({
      start,
      end,
      tables: input.tables,
      reservations: input.reservations,
      bufferMinutes: input.bufferMinutes ?? 10
    });

    return {
      time,
      available: true,
      suggestedTables: candidate.tableIds,
      capacityLeft: Math.max(0, capacityLeft - input.partySize)
    };
  });

  return {
    available: slots.some((slot) => slot.available),
    slots
  };
}

export function findBestCandidate({
  partySize,
  start,
  end,
  tables,
  combinations,
  reservations,
  bufferMinutes = 10
}: {
  partySize: number;
  start: Date;
  end: Date;
  tables: AvailabilityTable[];
  combinations: AvailabilityCombination[];
  reservations: AvailabilityReservation[];
  bufferMinutes?: number;
}) {
  const availableTableIds = new Set(
    tables
      .filter((table) => table.isActive && table.status !== "blocked" && table.status !== "maintenance")
      .filter((table) => !isTableBusy(table.id, start, end, reservations, bufferMinutes))
      .map((table) => table.id)
  );

  const singleTableCandidates = tables
    .filter((table) => availableTableIds.has(table.id))
    .filter((table) => table.seatsMin <= partySize && table.seatsMax >= partySize)
    .map((table) => ({
      kind: "single" as const,
      name: table.name,
      tableIds: [table.id],
      seatsMax: table.seatsMax,
      waste: table.seatsMax - partySize
    }));

  const combinationCandidates = combinations
    .filter((combination) => combination.isActive)
    .filter((combination) => combination.totalSeatsMin <= partySize && combination.totalSeatsMax >= partySize)
    .filter((combination) => combination.tableIds.every((id) => availableTableIds.has(id)))
    .map((combination) => ({
      kind: "combination" as const,
      name: combination.name,
      tableIds: combination.tableIds,
      seatsMax: combination.totalSeatsMax,
      waste: combination.totalSeatsMax - partySize
    }));

  return [...singleTableCandidates, ...combinationCandidates].sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === "single" ? -1 : 1;
    }

    return a.waste - b.waste || a.seatsMax - b.seatsMax;
  })[0];
}

export function dateTimeFromParts(date: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(`${date}T00:00:00`);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function buildCandidateSlots(input: AvailabilityInput) {
  const shifts = input.shifts.filter((shift) => shift.isActive);

  if (input.preferredTime) {
    return [input.preferredTime];
  }

  return shifts.flatMap((shift) => {
    const startMinutes = timeToMinutes(shift.startTime);
    const endMinutes = timeToMinutes(shift.endTime);
    const step = shift.slotIntervalMinutes || 30;
    const slots: string[] = [];

    for (let current = startMinutes; current <= endMinutes - step; current += step) {
      slots.push(minutesToTime(current));
    }

    return slots;
  });
}

function getDurationMinutes(partySize: number, start: Date, input: AvailabilityInput) {
  const base = partySize <= 2 ? 90 : partySize <= 4 ? 105 : 120;
  const shiftDuration = input.shifts.find((shift) =>
    isTimeInsideShift(formatTime(start), shift.startTime, shift.endTime)
  )?.defaultDurationMinutes;
  const weekendExtra = [0, 6].includes(start.getDay()) ? input.weekendExtraMinutes ?? 0 : 0;

  return Math.max(base, shiftDuration ?? base) + weekendExtra;
}

function computeCapacityLeft({
  start,
  end,
  tables,
  reservations,
  bufferMinutes
}: {
  start: Date;
  end: Date;
  tables: AvailabilityTable[];
  reservations: AvailabilityReservation[];
  bufferMinutes: number;
}) {
  return tables
    .filter((table) => table.isActive && table.status !== "blocked" && table.status !== "maintenance")
    .filter((table) => !isTableBusy(table.id, start, end, reservations, bufferMinutes))
    .reduce((total, table) => total + table.seatsMax, 0);
}

function isTableBusy(
  tableId: string,
  start: Date,
  end: Date,
  reservations: AvailabilityReservation[],
  bufferMinutes: number
) {
  const startWithBuffer = addMinutes(start, -bufferMinutes);
  const endWithBuffer = addMinutes(end, bufferMinutes);

  return reservations
    .filter((reservation) => ACTIVE_RESERVATION_STATUSES.has(reservation.status))
    .filter((reservation) => reservation.tableIds.includes(tableId))
    .some((reservation) => overlaps(startWithBuffer, endWithBuffer, reservation.start, reservation.end));
}

function emptySlot(time: string, reason: string): AvailabilitySlot {
  return {
    time,
    available: false,
    suggestedTables: [],
    capacityLeft: 0,
    reason
  };
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(date: Date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function isTimeInsideShift(time: string, startTime: string, endTime: string) {
  const current = timeToMinutes(time);
  return current >= timeToMinutes(startTime) && current <= timeToMinutes(endTime);
}
