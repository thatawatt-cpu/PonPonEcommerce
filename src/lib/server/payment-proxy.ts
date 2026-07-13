import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

const SKIP_AUTH =
  process.env.NEXT_PUBLIC_SKIP_LINE_LIFF?.trim().toLowerCase() === "true";

function unauthorizedResponse() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

function buildPaymentHeaders(auth: string | null, request?: NextRequest): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (auth) {
    headers.Authorization = auth;
  }

  const ifNoneMatch = request?.headers.get("If-None-Match");
  if (ifNoneMatch) {
    headers["If-None-Match"] = ifNoneMatch;
  }

  return headers;
}

async function readJsonResponse(response: Response) {
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}

async function readCacheableJsonResponse(response: Response) {
  const headers = new Headers();
  for (const key of ["Cache-Control", "ETag"]) {
    const value = response.headers.get(key);
    if (value) headers.set(key, value);
  }

  if (response.status === 304) {
    return new Response(null, { status: 304, headers });
  }

  headers.set("Content-Type", "application/json");
  const body = await response.text();
  return new Response(body, { status: response.status, headers });
}

export async function proxyPaymentPost(
  request: NextRequest,
  endpoint: string
) {
  const auth = request.headers.get("Authorization");
  const body = await request.json().catch(() => null);

  if (!auth && !SKIP_AUTH) {
    return unauthorizedResponse();
  }

  try {
    const response = await fetch(`${PONPON_BACKEND_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...buildPaymentHeaders(auth),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    return readJsonResponse(response);
  } catch {
    return NextResponse.json(
      { message: "Backend unreachable" },
      { status: 502 }
    );
  }
}

export async function proxyPaymentGet(
  request: NextRequest,
  endpoint: string
) {
  const auth = request.headers.get("Authorization");

  if (!auth && !SKIP_AUTH) {
    return unauthorizedResponse();
  }

  try {
    const response = await fetch(`${PONPON_BACKEND_BASE_URL}${endpoint}`, {
      headers: buildPaymentHeaders(auth, request),
      cache: "no-store",
    });

    return readCacheableJsonResponse(response);
  } catch {
    return NextResponse.json(
      { message: "Backend unreachable" },
      { status: 502 }
    );
  }
}
