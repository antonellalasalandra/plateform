import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const restaurantParamsSchema = z.object({
  restaurantId: z.string().min(1)
});

export async function getRestaurantContext(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      tenantId: true,
      name: true,
      capacity: true,
      timezone: true
    }
  });

  if (!restaurant) {
    throw new ApiError("Restaurant not found", 404);
  }

  return restaurant;
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: "Invalid payload", issues: error.flatten() }, { status: 422 });
  }

  console.error(error);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}

export class ApiError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

export function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function addMinutesToTime(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const nextHours = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const nextMinutes = (total % 60).toString().padStart(2, "0");

  return `${nextHours}:${nextMinutes}`;
}
