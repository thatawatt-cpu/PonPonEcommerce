import { NextRequest } from "next/server";
import { proxyBackendJson, requireAuth } from "@/lib/server/backend-proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  const { reviewId } = await params;
  const body = await request.text();
  return proxyBackendJson(request, `/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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
