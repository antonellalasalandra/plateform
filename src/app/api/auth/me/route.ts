import { NextResponse } from "next/server";
import { appUser, restaurant } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json({
    user: appUser,
    restaurant,
    role: "owner"
  });
}
