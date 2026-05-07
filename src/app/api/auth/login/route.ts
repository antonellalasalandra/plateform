import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const user = await prisma.user.findFirst({
      where: { email: payload.email, status: "active" },
      include: { tenant: true, restaurant: true }
    });

    if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
    }

    const token = await new SignJWT({
      sub: user.id,
      tenant_id: user.tenantId,
      restaurant_id: user.restaurantId,
      role: user.role
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me"));

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenant.slug,
        restaurant_id: user.restaurantId
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
