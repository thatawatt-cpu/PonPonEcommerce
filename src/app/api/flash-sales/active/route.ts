import { NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const res = await fetch(`${PONPON_BACKEND_BASE_URL}/api/flash-sales/active`, {
    cache: "no-store",
  });

  if (res.status === 204) {
    return new NextResponse(null, { status: 204, headers });
  }

  if (!res.ok) {
    return NextResponse.json(null, { status: res.status, headers });
  }

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { headers });
}
