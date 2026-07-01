import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

function buildShippingHeaders(auth: string | null): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (auth) {
    headers.Authorization = auth;
  }

  return headers;
}

async function readJsonResponse(response: Response) {
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}

export async function proxyShippopPost(
  request: NextRequest,
  endpoint: string
) {
  const auth = request.headers.get("Authorization");
  const body = await request.json().catch(() => null);

  try {
    const response = await fetch(`${PONPON_BACKEND_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...buildShippingHeaders(auth),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    return readJsonResponse(response);
  } catch {
    return NextResponse.json(
      { message: "Shipping backend unreachable" },
      { status: 502 }
    );
  }
}
