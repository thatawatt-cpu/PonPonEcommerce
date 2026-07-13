import { NextRequest } from "next/server";
import { proxyPaymentGet } from "@/lib/server/payment-proxy";

export async function GET(request: NextRequest) {
  return proxyPaymentGet(request, "/api/payments/omise-config");
}
