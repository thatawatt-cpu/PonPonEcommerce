import { products, categories } from "@/lib/mock-data";
import type { Product } from "@/types/product";
import type { Category } from "@/types/common";

export function getAllProducts(): Product[] {
  return products;
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getCategories(): Category[] {
  return categories;
}

export function getBestSellers(): Product[] {
  return products.filter((p) => p.isBestSeller);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.isFeatured);
}
