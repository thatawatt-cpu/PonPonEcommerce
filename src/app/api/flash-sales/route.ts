import { NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

export async function GET() {
  const res = await fetch(`${PONPON_BACKEND_BASE_URL}/api/flash-sales/active`, {
    next: { revalidate: 60 },
  });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  if (!res.ok) return NextResponse.json(null, { status: res.status });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data);
}
