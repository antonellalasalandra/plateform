import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createReservationSchema,
  createReservationWithAvailabilityLock,
  reservationToApi
} from "@/lib/reservation-service";
import { getRestaurantContext, jsonError, restaurantParamsSchema } from "@/lib/api";

const walkinSchema = z.object({
  party_size: z.coerce.number().int().min(1).max(40),
  customer_name: z.string().default("Walk-in"),
  table_ids: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export async function POST(request: Request, context: { params: Promise<{ restaurantId: string }> }) {
  try {
    const params = restaurantParamsSchema.parse(await context.params);
    const restaurant = await getRestaurantContext(params.restaurantId);
    const payload = walkinSchema.parse(await request.json());
    const now = new Date();
    const reservationDate = now.toISOString().slice(0, 10);
    const startTime = `${now.getHours().toString().padStart(2, "0")}:${(Math.floor(now.getMinutes() / 5) * 5)
      .toString()
      .padStart(2, "0")}`;

    const input = createReservationSchema.parse({
      customer_name: payload.customer_name,
      customer_phone: "-",
      party_size: payload.party_size,
      reservation_date: reservationDate,
      start_time: startTime,
      source: "walkin",
      notes: payload.notes,
      table_ids: payload.table_ids
    });

    const reservation = await createReservationWithAvailabilityLock({
      tenantId: restaurant.tenantId,
      restaurantId: restaurant.id,
      input
    });

    return NextResponse.json({ reservation: reservationToApi(reservation) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
