import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

const SKIP_AUTH =
  process.env.NEXT_PUBLIC_SKIP_LINE_LIFF?.trim().toLowerCase() === "true";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  const body = await request.json().catch(() => null);

  if (!auth) {
    if (!SKIP_AUTH) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.warn(
      "[orders/pricing-preview] NEXT_PUBLIC_SKIP_LINE_LIFF=true; forwarding preview without Authorization"
    );
  }

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (auth) {
      headers.Authorization = auth;
    }

    const response = await fetch(
      `${PONPON_BACKEND_BASE_URL}/api/orders/pricing-preview`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
