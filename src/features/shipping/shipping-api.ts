"use client";

import { ponponFetch } from "@/features/auth/ponpon-auth";
import type {
  ShippingRateOption,
  ShippingRateRequest,
} from "@/features/shipping/shipping-types";

async function readShippingError(response: Response, fallback: string) {
  const err = (await response.json().catch(() => null)) as
    | { message?: string; error?: string }
    | null;

  return err?.message ?? err?.error ?? `${fallback} (${response.status})`;
}

export async function fetchShippingRates(
  body: ShippingRateRequest
): Promise<ShippingRateOption[]> {
  const response = await ponponFetch("/api/shipping/rates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readShippingError(response, "Shipping rates failed"));
  }

  return response.json();
}
