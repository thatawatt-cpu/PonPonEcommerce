"use client";

const PRODUCT_DETAIL_SCROLL_TOP_KEY = "ponpon.productDetailScrollTop";

function canUseSessionStorage(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

export function markProductDetailNavigation(): void {
  if (!canUseSessionStorage()) return;

  window.sessionStorage.setItem(PRODUCT_DETAIL_SCROLL_TOP_KEY, "1");
}

export function consumeProductDetailScrollTop(): boolean {
  if (!canUseSessionStorage()) return false;

  const shouldScroll =
    window.sessionStorage.getItem(PRODUCT_DETAIL_SCROLL_TOP_KEY) === "1";
  window.sessionStorage.removeItem(PRODUCT_DETAIL_SCROLL_TOP_KEY);
  return shouldScroll;
}
