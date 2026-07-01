import "server-only";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";
import {
  mapApiCategoryToCategory,
  mapApiProductDetailToProduct,
  mapApiProductToProduct,
} from "./product-mapper";
import type { Category } from "@/types/common";
import type { Product } from "@/types/product";
import type {
  ApiCategory,
  ApiProductDetail,
  ApiProductListItem,
} from "@/types/api";

const ALL_CATEGORY: Category = { id: "all", name: "ทั้งหมด", emoji: "🛍️" };

export async function getAllProductsServer(params?: {
  keyword?: string;
  category?: string;
  pageSize?: number;
}): Promise<Product[]> {
  try {
    const url = new URL(`${PONPON_BACKEND_BASE_URL}/api/products`);
    if (params?.keyword) url.searchParams.set("keyword", params.keyword);
    if (params?.category && params.category !== "all")
      url.searchParams.set("category", params.category);
    url.searchParams.set("pageSize", String(params?.pageSize ?? 100));

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];

    const data: ApiProductListItem[] = await res.json();
    return Array.isArray(data) ? data.map(mapApiProductToProduct) : [];
  } catch (err) {
    console.error("[products] getAllProductsServer failed:", err);
    return [];
  }
}

export async function getProductByIdServer(
  id: string
): Promise<Product | null> {
  try {
    const res = await fetch(`${PONPON_BACKEND_BASE_URL}/api/products/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data: ApiProductDetail = await res.json();
    return mapApiProductDetailToProduct(data);
  } catch (err) {
    console.error("[products] getProductByIdServer failed:", err);
    return null;
  }
}

export async function getProductBySlugServer(
  slug: string
): Promise<Product | null> {
  try {
    const res = await fetch(
      `${PONPON_BACKEND_BASE_URL}/api/products/slug/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;

    const data: ApiProductDetail = await res.json();
    return mapApiProductDetailToProduct(data);
  } catch (err) {
    console.error("[products] getProductBySlugServer failed:", err);
    return null;
  }
}

export async function getCategoriesServer(): Promise<Category[]> {
  try {
    const res = await fetch(`${PONPON_BACKEND_BASE_URL}/api/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [ALL_CATEGORY];

    const data: ApiCategory[] = await res.json();
    return [ALL_CATEGORY, ...data.map(mapApiCategoryToCategory)];
  } catch (err) {
    console.error("[products] getCategoriesServer failed:", err);
    return [ALL_CATEGORY];
  }
}
