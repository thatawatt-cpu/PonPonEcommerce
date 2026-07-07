import "server-only";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";
import type { ApiCouponListItem } from "@/types/api";

function extractCouponItems(payload: unknown): ApiCouponListItem[] {
  if (Array.isArray(payload)) return payload as ApiCouponListItem[];

  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;

  for (const key of ["items", "coupons", "data", "results"]) {
    const value = record[key];
    if (Array.isArray(value)) return value as ApiCouponListItem[];
  }

  const nestedData = record.data;
  if (nestedData && typeof nestedData === "object") {
    const nestedRecord = nestedData as Record<string, unknown>;
    for (const key of ["items", "coupons", "results"]) {
      const value = nestedRecord[key];
      if (Array.isArray(value)) return value as ApiCouponListItem[];
    }
  }

  return [];
}

function isCouponVisible(coupon: ApiCouponListItem): boolean {
  if (coupon.isActive === false) return false;
  const status = coupon.status?.trim().toLowerCase();
  if (!status) return true;
  return ["active", "available", "published", "live"].includes(status);
}

export async function getCouponsServer(): Promise<ApiCouponListItem[]> {
  const url = new URL(`${PONPON_BACKEND_BASE_URL}/api/coupons`);
  url.searchParams.set("pageSize", "8");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];

    const payload = await res.json().catch(() => null);
    return extractCouponItems(payload).filter(isCouponVisible);
  } catch {
    return [];
  }
}
