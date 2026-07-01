import type { NextRequest } from "next/server";
import { proxyShippopPost } from "@/lib/server/shippop-client";

export async function POST(request: NextRequest) {
  return proxyShippopPost(request, "/api/shipping/rates");
}
