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
  isAnonymous?: boolean;
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
