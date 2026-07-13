import { type NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  const url = new URL(`${PONPON_BACKEND_BASE_URL}/api/shop/home`);

  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    url.searchParams.append(key, value);
  }

  try {
    const headers: HeadersInit = { Accept: "application/json" };
    if (auth) headers.Authorization = auth;

    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;

    const response = await fetch(url.toString(), {
      headers,
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    for (const key of ["Cache-Control", "ETag"]) {
      const value = response.headers.get(key);
      if (value) responseHeaders.set(key, value);
    }
    if (response.status === 304) {
      return new Response(null, { status: 304, headers: responseHeaders });
    }
    responseHeaders.set("Content-Type", "application/json");
    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
