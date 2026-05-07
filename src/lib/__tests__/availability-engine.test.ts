import { describe, expect, it } from "vitest";
import {
  computeAvailability,
  dateTimeFromParts,
  findBestCandidate,
  type AvailabilityTable
} from "../availability-engine";

const tables: AvailabilityTable[] = [
  { id: "t2", name: "T2", seatsMin: 1, seatsMax: 2, status: "available", isActive: true },
  { id: "t4", name: "T4", seatsMin: 2, seatsMax: 4, status: "available", isActive: true },
  { id: "t6", name: "T6", seatsMin: 4, seatsMax: 6, status: "available", isActive: true }
];

describe("availability engine", () => {
  it("uses the smallest compatible table first", () => {
    const candidate = findBestCandidate({
      partySize: 2,
      start: dateTimeFromParts("2026-05-07", "20:00"),
      end: dateTimeFromParts("2026-05-07", "21:30"),
      tables,
      combinations: [],
      reservations: []
    });

    expect(candidate?.tableIds).toEqual(["t2"]);
  });

  it("uses a combination only when single tables cannot fit", () => {
    const candidate = findBestCandidate({
      partySize: 8,
      start: dateTimeFromParts("2026-05-07", "20:00"),
      end: dateTimeFromParts("2026-05-07", "22:00"),
      tables,
      combinations: [
        {
          id: "combo",
          name: "T4 + T6",
          tableIds: ["t4", "t6"],
          totalSeatsMin: 6,
          totalSeatsMax: 10,
          isActive: true
        }
      ],
      reservations: []
    });

    expect(candidate?.tableIds).toEqual(["t4", "t6"]);
  });

  it("respects existing reservations and buffer", () => {
    const result = computeAvailability({
      date: "2026-05-07",
      partySize: 2,
      preferredTime: "20:00",
      tables: [tables[0]],
      combinations: [],
      shifts: [
        {
          id: "dinner",
          name: "Cena",
          startTime: "19:00",
          endTime: "23:00",
          defaultDurationMinutes: 90,
          slotIntervalMinutes: 30,
          isActive: true
        }
      ],
      reservations: [
        {
          id: "res",
          start: dateTimeFromParts("2026-05-07", "21:20"),
          end: dateTimeFromParts("2026-05-07", "22:30"),
          tableIds: ["t2"],
          status: "confirmed"
        }
      ],
      blockedSlots: [],
      bufferMinutes: 10
    });

    expect(result.available).toBe(false);
    expect(result.slots[0].reason).toBe("full");
  });

  it("marks slots inside manual blocks as unavailable", () => {
    const result = computeAvailability({
      date: "2026-05-07",
      partySize: 4,
      preferredTime: "20:00",
      tables,
      combinations: [],
      shifts: [
        {
          id: "dinner",
          name: "Cena",
          startTime: "19:00",
          endTime: "23:00",
          defaultDurationMinutes: 90,
          slotIntervalMinutes: 30,
          isActive: true
        }
      ],
      reservations: [],
      blockedSlots: [
        {
          start: dateTimeFromParts("2026-05-07", "19:30"),
          end: dateTimeFromParts("2026-05-07", "22:00")
        }
      ]
    });

    expect(result.available).toBe(false);
    expect(result.slots[0].reason).toBe("blocked");
  });
});
