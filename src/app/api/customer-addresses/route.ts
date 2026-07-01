import { NextRequest } from "next/server";
import { forwardCustomerAddressRequest } from "@/lib/server/customer-address-proxy";

export async function GET(request: NextRequest) {
  return forwardCustomerAddressRequest(request, "/api/customer-addresses");
}

export async function POST(request: NextRequest) {
  return forwardCustomerAddressRequest(request, "/api/customer-addresses", {
    method: "POST",
    body: await request.text(),
  });
}
