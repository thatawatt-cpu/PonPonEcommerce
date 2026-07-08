import type { ProductOption } from "./common";

export type ProductBadge = "ขายดี" | "มาใหม่" | "แนะนำ" | "ลดราคา";

export interface ProductGalleryItem {
  id: string;
  label: string;
  imageUrl: string;
  emoji?: string;
}

export interface ProductSizeGuide {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ProductDetailInfoCard {
  label: string;
  value: string;
}

export interface ProductDetailSection {
  title: string;
  body?: string;
  bullets?: string[];
  imageUrl?: string;
}

export interface ProductDetailContent {
  title?: string;
  summary?: string;
  richDescription?: string;
  highlights: string[];
  infoCards?: ProductDetailInfoCard[];
  sizeGuide?: ProductSizeGuide;
  sections?: ProductDetailSection[];
}

export interface ProductVariantStock {
  id?: string;
  sku?: string;
  variantCode?: string;
  options: Record<string, string>;
  stock: number;
  imageUrl?: string;
}

export interface Product {
  id: string;
  sku?: string;
  zortCategoryId?: number | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  priceSource?: "base" | "flash_sale" | string;
  activeFlashSaleId?: string | null;
  imageUrl: string;
  gallery?: ProductGalleryItem[];
  detailContent?: ProductDetailContent;
  /** Fallback shown only if the product image is unavailable. */
  emoji: string;
  categoryId: string;
  categoryName: string;
  badges: ProductBadge[];
  stock: number;
  soldCount?: number;
  rating?: number | null;
  reviewCount?: number;
  options?: ProductOption[];
  variants?: ProductVariantStock[];
  isFeatured: boolean;
  isBestSeller: boolean;
}
