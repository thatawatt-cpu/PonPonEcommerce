import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_LINE_LIFF?.trim().toLowerCase() === "true";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (!auth) {
    if (!SKIP_AUTH) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.warn("[orders] NEXT_PUBLIC_SKIP_LINE_LIFF=true; fetching orders without Authorization");
  }

  const { searchParams } = request.nextUrl;
  const forwardedParams = new URLSearchParams();
  for (const key of ["page", "pageSize"]) {
    const value = searchParams.get(key);
    if (value !== null) forwardedParams.set(key, value);
  }
  for (const key of ["status"]) {
    for (const value of searchParams.getAll(key)) {
      forwardedParams.append(key, value);
    }
  }
  const paymentStatuses = [
    ...searchParams.getAll("paymentstatus"),
    ...searchParams.getAll("paymentStatus"),
  ];
  for (const value of [...new Set(paymentStatuses)]) {
    forwardedParams.append("paymentstatus", value);
  }

  const qs = forwardedParams.toString();
  const url = `${PONPON_BACKEND_BASE_URL}/api/orders${qs ? `?${qs}` : ""}`;

  try {
    const headers: HeadersInit = { Accept: "application/json" };

    if (auth) {
      headers.Authorization = auth;
    }

    const response = await fetch(url, {
      headers,
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  const body = await request.json().catch(() => null);

  if (!auth) {
    if (!SKIP_AUTH) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.warn("[orders] NEXT_PUBLIC_SKIP_LINE_LIFF=true; forwarding order without Authorization");
  }

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (auth) {
      headers.Authorization = auth;
    }

    const response = await fetch(`${PONPON_BACKEND_BASE_URL}/api/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
