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
  const response = await ponponFetch("/api/coupons?pageSize=8");
  if (!response.ok) return [];

  const payload = await response.json().catch(() => null);
  return extractCouponItems(payload);
}
