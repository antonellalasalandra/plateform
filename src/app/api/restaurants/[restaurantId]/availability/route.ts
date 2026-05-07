import { NextResponse } from "next/server";
import { availabilityQuerySchema, getAvailabilityForRestaurant } from "@/lib/reservation-service";
import { getRestaurantContext, jsonError, restaurantParamsSchema } from "@/lib/api";

export async function GET(request: Request, context: { params: Promise<{ restaurantId: string }> }) {
  try {
    const params = restaurantParamsSchema.parse(await context.params);
    const query = availabilityQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const restaurant = await getRestaurantContext(params.restaurantId);
    const availability = await getAvailabilityForRestaurant({
      restaurantId: restaurant.id,
      tenantId: restaurant.tenantId,
      date: query.date,
      partySize: query.party_size,
      preferredTime: query.time
    });

    return NextResponse.json(availability);
  } catch (error) {
    return jsonError(error);
  }
}
