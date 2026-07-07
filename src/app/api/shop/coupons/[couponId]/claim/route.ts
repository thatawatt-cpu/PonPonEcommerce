import { type NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/shop/coupons/[couponId]/claim">
) {
  const auth = request.headers.get("Authorization");
  const { couponId } = await context.params;

  try {
    const headers: HeadersInit = { Accept: "application/json" };
    if (auth) headers.Authorization = auth;

    const response = await fetch(
      `${PONPON_BACKEND_BASE_URL}/api/shop/coupons/${encodeURIComponent(
        couponId
      )}/claim`,
      {
        method: "POST",
        headers,
        cache: "no-store",
      }
    );
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
