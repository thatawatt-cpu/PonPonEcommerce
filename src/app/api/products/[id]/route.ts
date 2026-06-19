import { NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(`${PONPON_BACKEND_BASE_URL}/api/products/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}
