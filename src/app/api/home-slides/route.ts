import { NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

export async function GET() {
  const res = await fetch(`${PONPON_BACKEND_BASE_URL}/api/home-slides`, {
    next: { revalidate: 60 },
  });
  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}
