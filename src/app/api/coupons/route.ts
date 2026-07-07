import { type NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  const { searchParams } = request.nextUrl;
  const url = new URL(`${PONPON_BACKEND_BASE_URL}/api/coupons`);

  for (const [key, value] of searchParams.entries()) {
    url.searchParams.append(key, value);
  }
  if (!url.searchParams.has("pageSize")) {
    url.searchParams.set("pageSize", "8");
  }

  try {
    const headers: HeadersInit = { Accept: "application/json" };
    if (auth) headers.Authorization = auth;

    const res = await fetch(url.toString(), {
      headers,
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
