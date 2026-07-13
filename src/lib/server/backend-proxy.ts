import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

const SKIP_AUTH =
  process.env.NEXT_PUBLIC_SKIP_LINE_LIFF?.trim().toLowerCase() === "true";

export function buildBackendHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = { Accept: "application/json" };
  const auth = request.headers.get("Authorization");
  if (auth) headers.Authorization = auth;
  return headers;
}

export function requireAuth(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (!auth && !SKIP_AUTH) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function proxyBackendJson(
  request: NextRequest,
  path: string,
  init: RequestInit = {}
) {
  try {
    const response = await fetch(`${PONPON_BACKEND_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...buildBackendHeaders(request),
        ...init.headers,
      },
      cache: "no-store",
    });
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
