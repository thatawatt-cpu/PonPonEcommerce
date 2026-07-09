import { NextRequest } from "next/server";
import { proxyBackendJson } from "@/lib/server/backend-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  return proxyBackendJson(
    request,
    `/api/products/${encodeURIComponent(productId)}/reviews/summary`
  );
}
