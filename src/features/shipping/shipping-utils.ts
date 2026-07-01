export interface ShippingSummary {
  shippingChannel: string | null | undefined;
  trackingNo?: string | null | undefined;
}

export function getCarrierName(channel: string | null | undefined): string {
  const normalized = channel?.trim();
  if (!normalized) return "รออัปเดตขนส่ง";

  const lower = normalized.toLowerCase();
  if (lower.includes("flash")) return "Flash Express";
  if (lower.includes("kerry")) return "Kerry Express";
  if (lower.includes("j&t") || lower.includes("jnt")) return "J&T Express";
  if (lower.includes("thai") || lower.includes("ไปรษณีย์")) return "ไปรษณีย์ไทย";
  if (lower.includes("best")) return "BEST Express";
  if (lower.includes("ninja")) return "Ninja Van";
  if (lower.includes("spx") || lower.includes("shopee")) return "SPX Express";
  if (lower.includes("shippop")) return "SHIPPOP";

  return normalized;
}

export function formatShippingLine(shipping: ShippingSummary): string {
  const carrier = getCarrierName(shipping.shippingChannel);
  return shipping.trackingNo ? `${carrier}: ${shipping.trackingNo}` : carrier;
}
