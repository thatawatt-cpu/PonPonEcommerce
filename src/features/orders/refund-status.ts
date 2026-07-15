export type OmiseRefundStatus =
  | "manual_refund_pending"
  | "manual_refunded"
  | "closed";

export type ReturnRequestStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "completed";

export function normalizeOmiseRefundStatus(
  status: unknown
): OmiseRefundStatus | null {
  const raw = String(status ?? "").trim();
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const compact = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");

  if (
    normalized === "manual_refund_pending" ||
    compact === "manualrefundpending"
  ) {
    return "manual_refund_pending";
  }

  if (
    normalized === "manual_refunded" ||
    compact === "manualrefunded"
  ) {
    return "manual_refunded";
  }

  if (normalized === "closed" || compact === "closed") {
    return "closed";
  }

  return null;
}

export function getManualRefundLabel(status: unknown): string | null {
  switch (normalizeOmiseRefundStatus(status)) {
    case "manual_refund_pending":
      return "รอคืนเงิน";
    case "manual_refunded":
    case "closed":
      return "คืนเงินสำเร็จ";
    default:
      return null;
  }
}

export function normalizeReturnRequestStatus(
  status: unknown
): ReturnRequestStatus | null {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    normalized === "requested" ||
    normalized === "approved" ||
    normalized === "rejected" ||
    normalized === "completed"
  ) {
    return normalized;
  }

  return null;
}

export function getReturnRefundText({
  omiseRefundStatus,
  returnRequestStatus,
  isCompletedRefundOrder = false,
  assumeReturnRefund = false,
}: {
  omiseRefundStatus?: unknown;
  returnRequestStatus?: unknown;
  isCompletedRefundOrder?: boolean;
  assumeReturnRefund?: boolean;
}): string | null {
  if (normalizeReturnRequestStatus(returnRequestStatus) === "completed") {
    return "คืนสินค้าสำเร็จ";
  }

  if (
    ["manual_refunded", "closed"].includes(
      normalizeOmiseRefundStatus(omiseRefundStatus) ?? ""
    ) ||
    isCompletedRefundOrder
  ) {
    return "คืนเงินสำเร็จ";
  }

  if (
    normalizeOmiseRefundStatus(omiseRefundStatus) ||
    normalizeReturnRequestStatus(returnRequestStatus) ||
    assumeReturnRefund
  ) {
    return "รอพิจารณา";
  }

  return null;
}
