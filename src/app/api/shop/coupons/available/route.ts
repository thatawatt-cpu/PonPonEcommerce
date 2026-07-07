import { type NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  const url = new URL(`${PONPON_BACKEND_BASE_URL}/api/shop/coupons/available`);

  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    url.searchParams.append(key, value);
  }

  try {
    const headers: HeadersInit = { Accept: "application/json" };
    if (auth) headers.Authorization = auth;

    const response = await fetch(url.toString(), {
      headers,
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
