import { type NextRequest } from "next/server";
import { proxyBackendJson, requireAuth } from "@/lib/server/backend-proxy";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  const { productId } = await context.params;
  return proxyBackendJson(
    request,
    `/api/customers/me/wishlist/${encodeURIComponent(productId)}`,
    {
      method: "POST",
    }
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  const { productId } = await context.params;
  return proxyBackendJson(
    request,
    `/api/customers/me/wishlist/${encodeURIComponent(productId)}`,
    {
      method: "DELETE",
    }
  );
}
