"use client";

import type { CartItem } from "@/types/cart";

const CART_SELECTION_CHECKOUT_STORAGE_KEY = "ponpon.cartSelectionCheckout";

export interface CartSelectionCheckoutItem {
  key: string;
  item: CartItem;
}

interface CartSelectionCheckoutPayload {
  items: CartSelectionCheckoutItem[];
  createdAt: string;
}

function canUseSessionStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

function isValidSelectionItem(
  value: Partial<CartSelectionCheckoutItem> | null | undefined
): value is CartSelectionCheckoutItem {
  const item = value?.item;

  return Boolean(
    value?.key &&
      item?.productId &&
      item.name &&
      item.imageUrl &&
      Number.isFinite(item.price) &&
      Number.isFinite(item.quantity) &&
      item.quantity > 0
  );
}

export function storeCartSelectionCheckout(
  items: CartSelectionCheckoutItem[]
): void {
  if (!canUseSessionStorage()) return;

  const payload: CartSelectionCheckoutPayload = {
    items,
    createdAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(
    CART_SELECTION_CHECKOUT_STORAGE_KEY,
    JSON.stringify(payload)
  );
}

export function getStoredCartSelectionCheckout(): CartSelectionCheckoutItem[] {
  if (!canUseSessionStorage()) return [];

  const raw = window.sessionStorage.getItem(
    CART_SELECTION_CHECKOUT_STORAGE_KEY
  );
  if (!raw) return [];

  try {
    const payload = JSON.parse(
      raw
    ) as Partial<CartSelectionCheckoutPayload>;

    if (!Array.isArray(payload.items)) return [];

    return payload.items.filter(isValidSelectionItem);
  } catch {
    return [];
  }
}

export function clearCartSelectionCheckout(): void {
  if (!canUseSessionStorage()) return;

  window.sessionStorage.removeItem(CART_SELECTION_CHECKOUT_STORAGE_KEY);
}
