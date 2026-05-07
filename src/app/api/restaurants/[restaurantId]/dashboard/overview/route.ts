import { NextResponse } from "next/server";
import { getRestaurantContext, jsonError, parseDateOnly, restaurantParamsSchema } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ restaurantId: string }> }) {
  try {
    const params = restaurantParamsSchema.parse(await context.params);
    const restaurant = await getRestaurantContext(params.restaurantId);
    const range = new URL(request.url).searchParams.get("range") ?? "30d";
    const today = new Date().toISOString().slice(0, 10);

    const [todayReservations, seatedReservations, weekReservations] = await Promise.all([
      prisma.reservation.findMany({
        where: { tenantId: restaurant.tenantId, restaurantId: restaurant.id, reservationDate: parseDateOnly(today) }
      }),
      prisma.reservation.findMany({
        where: { tenantId: restaurant.tenantId, restaurantId: restaurant.id, status: "seated" }
      }),
      prisma.reservation.count({
        where: { tenantId: restaurant.tenantId, restaurantId: restaurant.id, status: { notIn: ["cancelled", "no_show"] } }
      })
    ]);

    const coversInRoom = seatedReservations.reduce((total, reservation) => total + reservation.partySize, 0);
    const coversToday = todayReservations.reduce((total, reservation) => total + reservation.partySize, 0);

    return NextResponse.json({
      range,
      covers_in_room: coversInRoom,
      occupied_tables: seatedReservations.length,
      reservations_today: todayReservations.length,
      covers_today: coversToday,
      reservations_week: weekReservations,
      occupancy: restaurant.capacity > 0 ? Math.round((coversInRoom / restaurant.capacity) * 100) : 0
    });
  } catch (error) {
    return jsonError(error);
  }
}
