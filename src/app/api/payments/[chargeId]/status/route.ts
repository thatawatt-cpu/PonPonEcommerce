import { NextRequest } from "next/server";
import { proxyPaymentGet } from "@/lib/server/payment-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chargeId: string }> }
) {
  const { chargeId } = await params;

  return proxyPaymentGet(
    request,
    `/api/payments/${encodeURIComponent(chargeId)}/status`
  );
}
