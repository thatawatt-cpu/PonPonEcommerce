import { type NextRequest } from "next/server";
import { proxyBackendJson, requireAuth } from "@/lib/server/backend-proxy";

export async function GET(request: NextRequest) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  return proxyBackendJson(request, "/api/customers/me/recently-viewed", {
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.text();
  return proxyBackendJson(request, "/api/customers/me/recently-viewed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}
