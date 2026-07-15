export type OmiseRefundStatus =
  | "manual_refund_pending"
  | "manual_refunded";

export type ReturnRequestStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "completed";

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
  assumeReturnRefund = false,
}: {
  omiseRefundStatus?: unknown;
  returnRequestStatus?: unknown;
  assumeReturnRefund?: boolean;
}): string | null {
  if (normalizeOmiseRefundStatus(omiseRefundStatus) === "manual_refunded") {
    return "สำเร็จ";
  }

  if (normalizeReturnRequestStatus(returnRequestStatus) === "completed") {
    return "สำเร็จ";
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
