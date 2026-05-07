import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ reservationId: string }> }) {
  try {
    const { reservationId } = await context.params;
    const reservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: "seated" }
    });

    return NextResponse.json({ reservation });
  } catch (error) {
    return jsonError(error);
  }
}
