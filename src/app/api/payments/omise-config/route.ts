import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

export async function GET(request: NextRequest) {
  try {
    const headers: HeadersInit = { Accept: "application/json" };
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;

    const response = await fetch(
      `${PONPON_BACKEND_BASE_URL}/api/payments/omise-config`,
      {
        headers,
        cache: "no-store",
      }
    );
    const responseHeaders = new Headers();
    for (const key of ["Cache-Control", "ETag"]) {
      const value = response.headers.get(key);
      if (value) responseHeaders.set(key, value);
    }

    if (response.status === 304) {
      return new Response(null, { status: 304, headers: responseHeaders });
    }

    responseHeaders.set("Content-Type", "application/json");
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ message: "Backend unreachable" }, { status: 502 });
  }
}
