import type { ProductOption } from "./common";

export type ProductBadge = "ขายดี" | "มาใหม่" | "แนะนำ" | "ลดราคา";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  /** Emoji used as a friendly placeholder visual (no real images in the mock). */
  emoji: string;
  categoryId: string;
  categoryName: string;
  badges: ProductBadge[];
  stock: number;
  options?: ProductOption[];
  isFeatured: boolean;
  isBestSeller: boolean;
}
