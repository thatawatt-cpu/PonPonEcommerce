"use client";

import {
  getStoredPonPonJwt,
  ponponFetch,
} from "@/features/auth/ponpon-auth";
import type { ApiCouponListItem } from "@/types/api";

const AVAILABLE_COUPONS_CACHE_PREFIX = "ponpon.shop.availableCoupons";
const AVAILABLE_COUPONS_CACHE_TTL_MS = 60_000;

interface CachedCoupons {
  storedAt: number;
  items: ApiCouponListItem[];
}

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

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function getAvailableCouponsCacheKey(params?: {
  salesChannel?: string;
  paymentMethod?: string;
  shippingChannel?: string;
}): string {
  const qs = new URLSearchParams();
  qs.set("salesChannel", params?.salesChannel ?? "line_liff");
  if (params?.paymentMethod) qs.set("paymentMethod", params.paymentMethod);
  if (params?.shippingChannel) qs.set("shippingChannel", params.shippingChannel);
  return `${AVAILABLE_COUPONS_CACHE_PREFIX}:${getTokenCacheSegment()}:${qs.toString()}`;
}

function getTokenCacheSegment(): string {
  const token = getStoredPonPonJwt();
  if (!token) return "anonymous";

  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function readCachedCoupons(key: string): CachedCoupons | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCoupons;
    if (!Array.isArray(parsed.items) || typeof parsed.storedAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedCoupons(key: string, items: ApiCouponListItem[]): void {
  if (!canUseStorage()) return;

  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify({ storedAt: Date.now(), items })
    );
  } catch {
    // Ignore storage quota or privacy-mode failures; API fetching still works.
  }
}

export function getCachedAvailableCoupons(params?: {
  salesChannel?: string;
  paymentMethod?: string;
  shippingChannel?: string;
}): ApiCouponListItem[] {
  const cached = readCachedCoupons(getAvailableCouponsCacheKey(params));
  if (
    !cached ||
    Date.now() - cached.storedAt > AVAILABLE_COUPONS_CACHE_TTL_MS
  ) {
    return [];
  }
  return cached.items;
}

function updateCachedAvailableCoupon(coupon: ApiCouponListItem): void {
  if (!canUseStorage()) return;

  try {
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (!key?.startsWith(`${AVAILABLE_COUPONS_CACHE_PREFIX}:`)) continue;

      const cached = readCachedCoupons(key);
      if (!cached) continue;
      writeCachedCoupons(
        key,
        cached.items.map((item) =>
          item.id === coupon.id || item.code === coupon.code ? coupon : item
        )
      );
    }
  } catch {
    // Cache sync is best-effort; the next fetch will correct stale state.
  }
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
  const cacheKey = getAvailableCouponsCacheKey(params);

  const response = await ponponFetch(
    `/api/shop/coupons/available?${qs.toString()}`
  );
  if (!response.ok) {
    const cached = readCachedCoupons(cacheKey);
    if (
      cached &&
      Date.now() - cached.storedAt <= AVAILABLE_COUPONS_CACHE_TTL_MS
    ) {
      return cached.items;
    }
    return [];
  }

  const payload = await response.json().catch(() => null);
  const items = extractCouponItems(payload);
  writeCachedCoupons(cacheKey, items);
  return items;
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

  const coupon = (await response.json().catch(() => null)) as ApiCouponListItem | null;
  if (coupon?.id) updateCachedAvailableCoupon(coupon);
  return coupon;
}
