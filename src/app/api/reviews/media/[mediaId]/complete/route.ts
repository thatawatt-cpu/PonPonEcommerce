import { NextRequest } from "next/server";
import { proxyBackendJson, requireAuth } from "@/lib/server/backend-proxy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const unauthorized = requireAuth(request);
  if (unauthorized) return unauthorized;

  const { mediaId } = await params;
  return proxyBackendJson(
    request,
    `/api/reviews/media/${encodeURIComponent(mediaId)}/complete`,
    { method: "POST" }
  );
}
