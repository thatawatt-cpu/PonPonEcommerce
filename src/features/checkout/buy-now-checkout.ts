"use client";

import type { CartItem } from "@/types/cart";
import type { ApiPricingPreviewResponse } from "@/types/api";
import type { Product } from "@/types/product";

const BUY_NOW_CHECKOUT_STORAGE_KEY = "ponpon.buyNowCheckout";

interface BuyNowCheckoutPayload {
  item: CartItem;
  quote?: ApiPricingPreviewResponse | null;
  quoteSignature?: string | null;
  createdAt: string;
}

function normalizeOptions(
  selectedOptions?: Record<string, string>
): Record<string, string> | undefined {
  if (!selectedOptions) return undefined;

  const entries = Object.entries(selectedOptions)
    .filter(([, value]) => Boolean(value))
    .sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) return undefined;

  return Object.fromEntries(entries);
}

function canUseSessionStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

export function createBuyNowCartItem(input: {
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
  variantId?: string | null;
  imageUrl?: string;
}): CartItem {
  return {
    productId: input.product.id,
    productSlug: input.product.slug,
    variantId: input.variantId ?? null,
    name: input.product.name,
    price: input.product.price,
    imageUrl: input.imageUrl ?? input.product.imageUrl,
    emoji: input.product.emoji,
    quantity: input.quantity,
    selectedOptions: normalizeOptions(input.selectedOptions),
  };
}

export function storeBuyNowCheckout(
  item: CartItem,
  quote?: ApiPricingPreviewResponse | null,
  quoteSignature?: string | null
): void {
  if (!canUseSessionStorage()) return;

  const payload: BuyNowCheckoutPayload = {
    item,
    quote: quote ?? null,
    quoteSignature: quoteSignature ?? null,
    createdAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(
    BUY_NOW_CHECKOUT_STORAGE_KEY,
    JSON.stringify(payload)
  );
}

export function getStoredBuyNowCheckout(): CartItem | null {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(BUY_NOW_CHECKOUT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as Partial<BuyNowCheckoutPayload>;
    const item = payload.item;

    if (
      !item?.productId ||
      !item.name ||
      !item.imageUrl ||
      !Number.isFinite(item.price) ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      return null;
    }

    return item;
  } catch {
    return null;
  }
}

export function getStoredBuyNowCheckoutQuote(): {
  quote: ApiPricingPreviewResponse;
  signature: string | null;
} | null {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(BUY_NOW_CHECKOUT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as Partial<BuyNowCheckoutPayload>;
    if (!payload.quote || !Array.isArray(payload.quote.lines)) return null;

    return {
      quote: payload.quote,
      signature: payload.quoteSignature ?? null,
    };
  } catch {
    return null;
  }
}

export function clearBuyNowCheckout(): void {
  if (!canUseSessionStorage()) return;

  window.sessionStorage.removeItem(BUY_NOW_CHECKOUT_STORAGE_KEY);
}
