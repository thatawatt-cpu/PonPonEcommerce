import { NextRequest } from "next/server";
import { forwardCustomerAddressRequest } from "@/lib/server/customer-address-proxy";

type CustomerAddressRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  { params }: CustomerAddressRouteContext
) {
  const { id } = await params;

  return forwardCustomerAddressRequest(
    request,
    `/api/customer-addresses/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: await request.text(),
    }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: CustomerAddressRouteContext
) {
  const { id } = await params;

  return forwardCustomerAddressRequest(
    request,
    `/api/customer-addresses/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}
