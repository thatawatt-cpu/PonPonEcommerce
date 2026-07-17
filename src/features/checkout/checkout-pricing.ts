"use client";

import type { CartItem } from "@/types/cart";
import type { ApiPricingPreviewRequest } from "@/types/api";

export interface CheckoutAddressInput {
  email?: string | null;
  customerName?: string | null;
  phone?: string | null;
  address?: string | null;
}

export function buildCheckoutPricingRequest(input: {
  items: CartItem[];
  address?: CheckoutAddressInput | null;
  shippingChannel?: string | null;
  couponCodes?: string[] | null;
}): ApiPricingPreviewRequest {
  const address = input.address;
  const couponCodes = input.couponCodes?.filter(Boolean) ?? [];

  return {
    customerEmail: address?.email?.trim() || null,
    shippingName: address?.customerName?.trim() || null,
    shippingPhone: address?.phone?.trim() || null,
    shippingAddress: address?.address?.trim() || null,
    shippingChannel: input.shippingChannel?.trim() || "standard",
    couponCode: couponCodes[0] ?? null,
    couponCodes: couponCodes.length > 0 ? couponCodes : null,
    items: input.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
    })),
  };
}

export function getCheckoutPricingSignature(
  request: ApiPricingPreviewRequest
): string {
  return JSON.stringify(request);
}
