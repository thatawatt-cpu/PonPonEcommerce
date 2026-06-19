"use client";

import { ponponFetch } from "@/features/auth/ponpon-auth";
import type {
  ApiCreateOrderRequest,
  ApiCreateOrderResponse,
  ApiOrderListItem,
  ApiOrderDetail,
} from "@/types/api";

export async function createOrder(
  body: ApiCreateOrderRequest
): Promise<ApiCreateOrderResponse> {
  const response = await ponponFetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      (err as { message?: string } | null)?.message ??
        `สร้างออเดอร์ไม่สำเร็จ (${response.status})`
    );
  }

  return response.json();
}

export async function fetchOrders(params?: {
  status?: string;
  paymentStatus?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiOrderListItem[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.paymentStatus) qs.set("paymentStatus", params.paymentStatus);
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.pageSize != null) qs.set("pageSize", String(params.pageSize));

  const response = await ponponFetch(
    `/api/orders${qs.toString() ? `?${qs}` : ""}`
  );

  if (!response.ok) {
    throw new Error(`โหลดรายการออเดอร์ไม่สำเร็จ (${response.status})`);
  }

  return response.json();
}

export async function fetchOrderById(id: string): Promise<ApiOrderDetail> {
  const response = await ponponFetch(`/api/orders/${id}`);

  if (!response.ok) {
    throw new Error(`โหลดออเดอร์ไม่สำเร็จ (${response.status})`);
  }

  return response.json();
}

export async function cancelOrder(id: string): Promise<void> {
  const response = await ponponFetch(`/api/orders/${id}/cancel`, {
    method: "POST",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      (err as { message?: string } | null)?.message ??
        `ยกเลิกออเดอร์ไม่สำเร็จ (${response.status})`
    );
  }
}
