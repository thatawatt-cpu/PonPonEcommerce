import { NextRequest } from "next/server";
import { forwardCustomerAddressRequest } from "@/lib/server/customer-address-proxy";

type CustomerAddressDefaultRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  { params }: CustomerAddressDefaultRouteContext
) {
  const { id } = await params;

  return forwardCustomerAddressRequest(
    request,
    `/api/customer-addresses/${encodeURIComponent(id)}/default`,
    {
      method: "PUT",
    }
  );
}
