import { NextResponse } from "next/server";
import { z } from "zod";
import { getRestaurantContext, jsonError, restaurantParamsSchema } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const tableSchema = z.object({
  name: z.string().min(1),
  dining_area_id: z.string().optional(),
  seats_min: z.coerce.number().int().min(1),
  seats_max: z.coerce.number().int().min(1),
  position_x: z.coerce.number().int().default(0),
  position_y: z.coerce.number().int().default(0)
});

export async function GET(_request: Request, context: { params: Promise<{ restaurantId: string }> }) {
  try {
    const params = restaurantParamsSchema.parse(await context.params);
    const restaurant = await getRestaurantContext(params.restaurantId);
    const tables = await prisma.restaurantTable.findMany({
      where: { tenantId: restaurant.tenantId, restaurantId: restaurant.id, isActive: true },
      orderBy: [{ seatsMax: "asc" }, { name: "asc" }]
    });

    return NextResponse.json({ tables });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ restaurantId: string }> }) {
  try {
    const params = restaurantParamsSchema.parse(await context.params);
    const restaurant = await getRestaurantContext(params.restaurantId);
    const payload = tableSchema.parse(await request.json());
    const table = await prisma.restaurantTable.create({
      data: {
        tenantId: restaurant.tenantId,
        restaurantId: restaurant.id,
        diningAreaId: payload.dining_area_id,
        name: payload.name,
        seatsMin: payload.seats_min,
        seatsMax: payload.seats_max,
        positionX: payload.position_x,
        positionY: payload.position_y
      }
    });

    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
