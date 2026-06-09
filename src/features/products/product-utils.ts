import type { Product } from "@/types/product";

/** Filter by search query (name) and category id. "all" matches every category. */
export function filterProducts(
  items: Product[],
  query: string,
  categoryId: string
): Product[] {
  const q = query.trim().toLowerCase();
  return items.filter((product) => {
    const matchesCategory =
      categoryId === "all" || product.categoryId === categoryId;
    const matchesQuery =
      q.length === 0 ||
      product.name.toLowerCase().includes(q) ||
      product.description.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

/** Percentage off when a compareAtPrice is present. */
export function getDiscountPercent(product: Product): number | null {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) {
    return null;
  }
  return Math.round(
    ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
  );
}
