import { NextRequest } from "next/server";
import { proxyBackendJson } from "@/lib/server/backend-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyBackendJson(
    request,
    `/api/products/${encodeURIComponent(id)}/reviews/summary`
  );
}
