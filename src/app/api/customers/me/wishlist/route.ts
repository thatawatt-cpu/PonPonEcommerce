import { type NextRequest } from "next/server";
import { proxyBackendJson, requireAuth } from "@/lib/server/backend-proxy";

export async function GET(request: NextRequest) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  return proxyBackendJson(request, "/api/customers/me/wishlist", {
    method: "GET",
  });
}
