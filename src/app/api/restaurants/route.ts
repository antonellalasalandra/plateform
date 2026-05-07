import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const createRestaurantSchema = z.object({
  tenant_id: z.string(),
  name: z.string().min(2),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  capacity: z.coerce.number().int().min(1).default(40)
});

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json({ restaurants });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = createRestaurantSchema.parse(await request.json());
    const restaurant = await prisma.restaurant.create({
      data: {
        tenantId: payload.tenant_id,
        name: payload.name,
        address: payload.address,
        city: payload.city,
        phone: payload.phone,
        email: payload.email,
        capacity: payload.capacity
      }
    });

    return NextResponse.json({ restaurant }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
