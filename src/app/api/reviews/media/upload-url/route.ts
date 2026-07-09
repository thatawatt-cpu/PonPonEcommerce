import { NextRequest } from "next/server";
import { proxyBackendJson, requireAuth } from "@/lib/server/backend-proxy";

export async function POST(request: NextRequest) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.text();
  return proxyBackendJson(request, "/api/reviews/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
