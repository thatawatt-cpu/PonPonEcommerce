"use client";

import { ponponFetch } from "@/features/auth/ponpon-auth";
import type {
  ProductReview,
  ProductReviewSummary,
  ReviewMediaType,
} from "@/types/review";

export interface ReviewMediaFileInput {
  file: File;
  type: ReviewMediaType;
  durationSec: number | null;
  sortOrder: number;
}

export interface ReviewFormPayload {
  rating: number;
  comment: string;
  media: ReviewMediaFileInput[];
}

interface ApiErrorPayload {
  message?: string;
  error?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[] | string>;
}

async function readError(response: Response, fallback: string): Promise<Error> {
  const data = (await response.json().catch(() => null)) as ApiErrorPayload | null;
  const validationErrors = data?.errors
    ? Object.values(data.errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(" ")
    : "";
  const message =
    validationErrors || data?.detail || data?.message || data?.error || data?.title || fallback;

  return new Error(message);
}

function buildReviewFormData(payload: ReviewFormPayload): FormData {
  const form = new FormData();
  form.append("rating", String(payload.rating));
  form.append("comment", payload.comment);

  payload.media.forEach((media, index) => {
    const prefix = `media[${index}]`;
    form.append(`${prefix}.type`, media.type);
    form.append(`${prefix}.file`, media.file);
    if (media.type === "video" && media.durationSec != null) {
      form.append(`${prefix}.durationSec`, String(Math.ceil(media.durationSec)));
    }
    form.append(`${prefix}.sortOrder`, String(media.sortOrder));
  });

  return form;
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
  payload: ReviewFormPayload
): Promise<ProductReview> {
  const response = await ponponFetch(
    `/api/order-items/${encodeURIComponent(orderItemId)}/review`,
    {
      method: "POST",
      body: buildReviewFormData(payload),
    }
  );
  if (!response.ok) {
    throw await readError(response, "ส่งรีวิวไม่สำเร็จ");
  }
  return response.json();
}

export async function updateReview(
  reviewId: string,
  payload: ReviewFormPayload
): Promise<ProductReview> {
  const response = await ponponFetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PATCH",
    body: buildReviewFormData(payload),
  });
  if (!response.ok) {
    throw await readError(response, "แก้ไขรีวิวไม่สำเร็จ");
  }
  return response.json();
}
