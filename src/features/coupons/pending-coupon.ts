"use client";

const PENDING_COUPON_CODE_STORAGE_KEY = "ponpon.pendingCouponCode";

export function storePendingCouponCode(code: string) {
  if (typeof window === "undefined") return;
  const nextCode = code.trim().toUpperCase();
  if (!nextCode) return;
  window.sessionStorage.setItem(PENDING_COUPON_CODE_STORAGE_KEY, nextCode);
}

export function consumePendingCouponCode(): string | null {
  if (typeof window === "undefined") return null;
  const code = window.sessionStorage
    .getItem(PENDING_COUPON_CODE_STORAGE_KEY)
    ?.trim()
    .toUpperCase();
  window.sessionStorage.removeItem(PENDING_COUPON_CODE_STORAGE_KEY);
  return code || null;
}
