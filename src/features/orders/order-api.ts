"use client";

import { ponponFetch } from "@/features/auth/ponpon-auth";
import type {
  ApiCreateOrderRequest,
  ApiCreateOrderResponse,
  ApiPricingPreviewRequest,
  ApiPricingPreviewResponse,
  ApiOrderListItem,
  ApiOrderListResponse,
  ApiOrderDetail,
} from "@/types/api";

interface ApiErrorPayload {
  code?: string;
  message?: string;
  error?: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  code?: string;
  details?: unknown;
  status: number;

  constructor(input: {
    message: string;
    status: number;
    code?: string;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "ApiRequestError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
  }
}

async function readApiRequestError(
  response: Response,
  fallbackMessage: string
): Promise<ApiRequestError> {
  const err = (await response.json().catch(() => null)) as
    | ApiErrorPayload
    | null;

  return new ApiRequestError({
    status: response.status,
    code: err?.code,
    details: err?.details,
    message: err?.message ?? err?.error ?? fallbackMessage,
  });
}

export async function createOrder(
  body: ApiCreateOrderRequest
): Promise<ApiCreateOrderResponse> {
  const response = await ponponFetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await readApiRequestError(
      response,
      `สร้างออเดอร์ไม่สำเร็จ (${response.status})`
    );
  }

  return response.json();
}

export async function fetchPricingPreview(
  body: ApiPricingPreviewRequest
): Promise<ApiPricingPreviewResponse> {
  const response = await ponponFetch("/api/orders/pricing-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await readApiRequestError(
      response,
      `คำนวณราคาไม่สำเร็จ (${response.status})`
    );
  }

  return response.json();
}

export async function fetchOrders(params?: {
  status?: string[];
  paymentstatus?: string | string[];
  paymentStatus?: string | string[];
  page?: number;
  pageSize?: number;
}): Promise<ApiOrderListResponse> {
  const qs = new URLSearchParams();
  if (params?.status) {
    for (const s of params.status) qs.append("status", s);
  }
  const paymentStatus = params?.paymentstatus ?? params?.paymentStatus;
  if (paymentStatus) {
    const paymentStatuses = Array.isArray(paymentStatus)
      ? paymentStatus
      : [paymentStatus];
    for (const s of paymentStatuses) qs.append("paymentstatus", s);
  }
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.pageSize != null) qs.set("pageSize", String(params.pageSize));

  const response = await ponponFetch(
    `/api/orders${qs.toString() ? `?${qs}` : ""}`
  );

  if (!response.ok) {
    throw new Error(`โหลดรายการออเดอร์ไม่สำเร็จ (${response.status})`);
  }

  const data = (await response.json()) as ApiOrderListResponse | ApiOrderListItem[];

  if (Array.isArray(data)) {
    const pageSize = params?.pageSize ?? 10;
    return {
      items: data,
      page: params?.page ?? 1,
      pageSize,
      total: data.length,
      hasMore: data.length === pageSize,
    };
  }

  return data;
}

export async function fetchOrderById(id: string): Promise<ApiOrderDetail> {
  const response = await ponponFetch(`/api/orders/${id}`);

  if (!response.ok) {
    throw new Error(`โหลดออเดอร์ไม่สำเร็จ (${response.status})`);
  }

  return response.json();
}

export interface CancelOrderInput {
  reason: string;
  detail?: string;
}

export interface CancelOrderResult {
  omiseRefundStatus?: string | null;
  order?: {
    omiseRefundStatus?: string | null;
  } | null;
}

export async function cancelOrder(
  id: string,
  input: CancelOrderInput
): Promise<CancelOrderResult> {
  const reason = input.detail?.trim()
    ? `${input.reason.trim()} - ${input.detail.trim()}`
    : input.reason.trim();

  const response = await ponponFetch(`/api/orders/${id}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      (err as { message?: string } | null)?.message ??
        `ยกเลิกออเดอร์ไม่สำเร็จ (${response.status})`
    );
  }

  if (response.status === 204) return {};

  return (await response.json().catch(() => ({}))) as CancelOrderResult;
}

export interface CreateReturnRequestInput {
  reason: string;
  photos: File[];
}

export async function createReturnRequest(
  id: string,
  input: CreateReturnRequestInput
): Promise<void> {
  const body = new FormData();
  body.append("reason", input.reason.trim());
  for (const photo of input.photos) {
    body.append("photos", photo, photo.name);
  }

  const response = await ponponFetch(`/api/orders/${id}/return-request`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      (err as { message?: string } | null)?.message ??
        `ส่งคำขอคืนสินค้าไม่สำเร็จ (${response.status})`
    );
  }
}
