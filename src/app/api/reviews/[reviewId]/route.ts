import { NextRequest } from "next/server";
import { proxyBackendJson, requireAuth } from "@/lib/server/backend-proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  const { reviewId } = await params;
  const body = await request.arrayBuffer();
  const contentType = request.headers.get("content-type");
  return proxyBackendJson(request, `/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PATCH",
    headers: contentType ? { "Content-Type": contentType } : undefined,
    body,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  const { reviewId } = await params;
  return proxyBackendJson(request, `/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
  });
}
