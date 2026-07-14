export type OmiseRefundStatus =
  | "manual_refund_pending"
  | "manual_refunded";

export function normalizeOmiseRefundStatus(
  status: unknown
): OmiseRefundStatus | null {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    normalized === "manual_refund_pending" ||
    normalized === "manual_refunded"
  ) {
    return normalized;
  }

  return null;
}

export function getManualRefundLabel(status: unknown): string | null {
  switch (normalizeOmiseRefundStatus(status)) {
    case "manual_refund_pending":
      return "รอคืนเงิน";
    case "manual_refunded":
      return "คืนเงินสำเร็จ";
    default:
      return null;
  }
}
