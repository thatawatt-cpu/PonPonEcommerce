export type ReviewMediaType = "image" | "video";
export type ReviewStatus = "published" | "hidden";
export type ReviewMediaStatus = "processing" | "ready" | "failed";

export interface ReviewMediaPayload {
  type: ReviewMediaType;
  url: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  fileSizeBytes: number;
  mimeType: string;
  sortOrder: number;
}

export interface ProductReviewMedia extends ReviewMediaPayload {
  id?: string;
  status?: ReviewMediaStatus | string;
}

export interface ProductReview {
  id: string;
  productId?: string | null;
  variantId?: string | null;
  orderId?: string | null;
  orderItemId?: string | null;
  userId?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
  customerName?: string | null;
  rating: number;
  comment: string;
  status?: ReviewStatus | string;
  media: ProductReviewMedia[];
  createdAt: string;
  updatedAt?: string | null;
  editedAt?: string | null;
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown?: Record<string, number>;
}

export interface ReviewMutationPayload {
  rating: number;
  comment: string;
  media: ReviewMediaPayload[];
}

export interface ReviewUploadUrlRequest {
  reviewId: string;
  type: ReviewMediaType;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  durationSec?: number | null;
  sortOrder?: number;
}

export interface OrderItemReviewUploadUrlRequest {
  type: ReviewMediaType;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  durationSec?: number | null;
  sortOrder?: number;
}

export interface ReviewUploadUrlResponse {
  mediaId: string;
  uploadUrl: string;
  publicUrl?: string;
  url?: string;
  thumbnailUrl?: string | null;
  maxFileSizeBytes?: number;
}
