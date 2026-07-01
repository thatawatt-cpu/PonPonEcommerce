import { NextRequest } from "next/server";
import { proxyPaymentPost } from "@/lib/server/payment-proxy";

export async function POST(request: NextRequest) {
  return proxyPaymentPost(request, "/api/payments/credit-card");
}
