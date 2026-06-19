import { type NextRequest, NextResponse } from "next/server";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = new URL(`${PONPON_BACKEND_BASE_URL}/api/products`);

  for (const param of ["keyword", "category", "page", "pageSize"]) {
    const value = searchParams.get(param);
    if (value) url.searchParams.set(param, value);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });

  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}
