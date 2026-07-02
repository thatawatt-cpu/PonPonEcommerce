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
      return "รอร้านค้าคืนเงิน";
    case "manual_refunded":
      return "ร้านค้าคืนเงินเรียบร้อยแล้ว";
    default:
      return null;
  }
}
