import { NextRequest } from "next/server";
import { proxyBackendJson, requireAuth } from "@/lib/server/backend-proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderItemId: string }> }
) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  const { orderItemId } = await params;
  const body = await request.arrayBuffer();
  const contentType = request.headers.get("content-type");
  return proxyBackendJson(
    request,
    `/api/order-items/${encodeURIComponent(orderItemId)}/review`,
    {
      method: "POST",
      headers: contentType ? { "Content-Type": contentType } : undefined,
      body,
    }
  );
}
