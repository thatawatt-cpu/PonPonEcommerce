"use client";

import { ponponFetch } from "@/features/auth/ponpon-auth";
import type {
  ProductReview,
  ProductReviewSummary,
  OrderItemReviewUploadUrlRequest,
  ReviewMediaPayload,
  ReviewMutationPayload,
  ReviewUploadUrlRequest,
  ReviewUploadUrlResponse,
} from "@/types/review";

interface ApiErrorPayload {
  message?: string;
  error?: string;
}

async function readError(response: Response, fallback: string): Promise<Error> {
  const data = (await response.json().catch(() => null)) as ApiErrorPayload | null;
  return new Error(data?.message ?? data?.error ?? fallback);
}

function unwrapItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const obj = data as { items?: unknown; reviews?: unknown; data?: unknown };
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.reviews)) return obj.reviews as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

export async function fetchProductReviews(
  productId: string,
  params?: { page?: number; limit?: number; sort?: string }
): Promise<ProductReview[]> {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.sort) qs.set("sort", params.sort);

  const response = await fetch(
    `/api/products/${encodeURIComponent(productId)}/reviews${qs.toString() ? `?${qs}` : ""}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw await readError(response, "โหลดรีวิวไม่สำเร็จ");
  }

  return unwrapItems<ProductReview>(await response.json().catch(() => null));
}

export async function fetchProductReviewSummary(
  productId: string
): Promise<ProductReviewSummary> {
  const response = await fetch(
    `/api/products/${encodeURIComponent(productId)}/reviews/summary`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw await readError(response, "โหลดคะแนนรีวิวไม่สำเร็จ");
  }

  const data = (await response.json().catch(() => null)) as
    | Partial<ProductReviewSummary>
    | null;
  return {
    averageRating: Number(data?.averageRating ?? 0),
    totalReviews: Number(data?.totalReviews ?? 0),
    ratingBreakdown: data?.ratingBreakdown,
  };
}

export async function createOrderItemReview(
  orderItemId: string,
  payload: ReviewMutationPayload
): Promise<ProductReview> {
  const response = await ponponFetch(
    `/api/order-items/${encodeURIComponent(orderItemId)}/review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!response.ok) {
    throw await readError(response, "ส่งรีวิวไม่สำเร็จ");
  }
  return response.json();
}

export async function updateReview(
  reviewId: string,
  payload: ReviewMutationPayload
): Promise<ProductReview> {
  const response = await ponponFetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await readError(response, "แก้ไขรีวิวไม่สำเร็จ");
  }
  return response.json();
}

export async function requestReviewUploadUrl(
  payload: ReviewUploadUrlRequest
): Promise<ReviewUploadUrlResponse> {
  const response = await ponponFetch("/api/reviews/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await readError(response, "ขอ URL สำหรับอัปโหลดไม่สำเร็จ");
  }
  return response.json();
}

export async function requestOrderItemReviewUploadUrl(
  orderItemId: string,
  payload: OrderItemReviewUploadUrlRequest
): Promise<ReviewUploadUrlResponse> {
  const response = await ponponFetch(
    `/api/order-items/${encodeURIComponent(orderItemId)}/review/media/upload-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!response.ok) {
    throw await readError(response, "ขอ URL สำหรับอัปโหลดไม่สำเร็จ");
  }
  return response.json();
}

export async function completeReviewMediaUpload(mediaId: string): Promise<void> {
  const response = await ponponFetch(
    `/api/reviews/media/${encodeURIComponent(mediaId)}/complete`,
    { method: "POST" }
  );
  if (!response.ok) {
    throw await readError(response, "ยืนยันอัปโหลดสื่อไม่สำเร็จ");
  }
}

export async function uploadReviewFile(
  file: File,
  input: {
    reviewId: string;
    durationSec?: number | null;
    sortOrder?: number;
  }
): Promise<ReviewMediaPayload> {
  const type = file.type.startsWith("video/") ? "video" : "image";
  const upload = await requestReviewUploadUrl({
    reviewId: input.reviewId,
    type,
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type,
    durationSec: input.durationSec ?? null,
    sortOrder: input.sortOrder ?? 0,
  });

  const uploadResponse = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("อัปโหลดไฟล์รีวิวไม่สำเร็จ");
  }

  await completeReviewMediaUpload(upload.mediaId);

  return {
    type,
    url: upload.publicUrl ?? upload.url ?? upload.uploadUrl.split("?")[0],
    thumbnailUrl: upload.thumbnailUrl ?? null,
    durationSec: input.durationSec ?? null,
    fileSizeBytes: file.size,
    mimeType: file.type,
    sortOrder: input.sortOrder ?? 0,
  };
}

export async function uploadOrderItemReviewFile(
  orderItemId: string,
  file: File,
  input: {
    durationSec?: number | null;
    sortOrder?: number;
  }
): Promise<ReviewMediaPayload> {
  const type = file.type.startsWith("video/") ? "video" : "image";
  const upload = await requestOrderItemReviewUploadUrl(orderItemId, {
    type,
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type,
    durationSec: input.durationSec ?? null,
    sortOrder: input.sortOrder ?? 0,
  });

  const uploadResponse = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("อัปโหลดไฟล์รีวิวไม่สำเร็จ");
  }

  await completeReviewMediaUpload(upload.mediaId);

  return {
    type,
    url: upload.publicUrl ?? upload.url ?? upload.uploadUrl.split("?")[0],
    thumbnailUrl: upload.thumbnailUrl ?? null,
    durationSec: input.durationSec ?? null,
    fileSizeBytes: file.size,
    mimeType: file.type,
    sortOrder: input.sortOrder ?? 0,
  };
}
