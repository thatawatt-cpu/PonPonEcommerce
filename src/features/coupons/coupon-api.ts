"use client";

import { ponponFetch } from "@/features/auth/ponpon-auth";
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

export async function fetchCoupons(): Promise<ApiCouponListItem[]> {
  return fetchAvailableCoupons();
}

export async function fetchAvailableCoupons(params?: {
  salesChannel?: string;
  paymentMethod?: string;
  shippingChannel?: string;
}): Promise<ApiCouponListItem[]> {
  const qs = new URLSearchParams();
  qs.set("salesChannel", params?.salesChannel ?? "line_liff");
  if (params?.paymentMethod) qs.set("paymentMethod", params.paymentMethod);
  if (params?.shippingChannel) qs.set("shippingChannel", params.shippingChannel);

  const response = await ponponFetch(
    `/api/shop/coupons/available?${qs.toString()}`
  );
  if (!response.ok) return [];

  const payload = await response.json().catch(() => null);
  return extractCouponItems(payload);
}

export async function fetchMyCoupons(): Promise<ApiCouponListItem[]> {
  const response = await ponponFetch("/api/shop/coupons/me");
  if (!response.ok) return [];

  const payload = await response.json().catch(() => null);
  return extractCouponItems(payload);
}

export async function claimCoupon(
  couponId: string
): Promise<ApiCouponListItem | null> {
  const response = await ponponFetch(
    `/api/shop/coupons/${encodeURIComponent(couponId)}/claim`,
    { method: "POST" }
  );
  if (!response.ok) return null;

  return (await response.json().catch(() => null)) as ApiCouponListItem | null;
}
