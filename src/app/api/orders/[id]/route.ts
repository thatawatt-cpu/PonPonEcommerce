import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_LINE_LIFF?.trim().toLowerCase() === "true";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = request.headers.get("Authorization");
  if (!auth) {
    if (!SKIP_AUTH) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.warn("[orders] NEXT_PUBLIC_SKIP_LINE_LIFF=true; fetching order detail without Authorization");
  }

  const { id } = await params;

  try {
    const headers: HeadersInit = { Accept: "application/json" };

    if (auth) {
      headers.Authorization = auth;
    }

    const response = await fetch(
      `${PONPON_BACKEND_BASE_URL}/api/orders/${id}`,
      {
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
