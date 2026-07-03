import { NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

const SKIP_AUTH =
  process.env.NEXT_PUBLIC_SKIP_LINE_LIFF?.trim().toLowerCase() === "true";

export function getNotificationAuthHeaders(
  request: NextRequest
): HeadersInit | NextResponse {
  const auth = request.headers.get("Authorization");
  if (!auth) {
    if (!SKIP_AUTH) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.warn(
      "[notifications] NEXT_PUBLIC_SKIP_LINE_LIFF=true; forwarding without Authorization"
    );
  }

  const headers: HeadersInit = { Accept: "application/json" };
  if (auth) headers.Authorization = auth;
  return headers;
}

export function getNotificationsBackendUrl(path: string): string {
  return `${PONPON_BACKEND_BASE_URL}${path}`;
}

export async function proxyNotificationJsonResponse(
  response: Response
): Promise<NextResponse> {
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}

export function backendUnreachableResponse(): NextResponse {
  return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
}
