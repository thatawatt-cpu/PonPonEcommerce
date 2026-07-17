import type { Product } from "@/types/product";

const CACHE_PREFIX = "ponpon:product-detail-summary:";
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface CachedProductDetailSummary {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  emoji: string;
  price: number;
  compareAtPrice?: number;
  soldCount?: number;
  rating?: number | null;
  reviewCount?: number;
  badges: Product["badges"];
}

interface CachedProductDetailPayload {
  version: number;
  cachedAt: number;
  product: CachedProductDetailSummary;
}

function getCacheKey(slug: string): string {
  return `${CACHE_PREFIX}${slug}`;
}

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function cacheProductDetailSummary(product: Product): void {
  const storage = getSessionStorage();
  if (!storage || !product.slug) return;

  const payload: CachedProductDetailPayload = {
    version: CACHE_VERSION,
    cachedAt: Date.now(),
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      emoji: product.emoji,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      soldCount: product.soldCount,
      rating: product.rating,
      reviewCount: product.reviewCount,
      badges: product.badges,
    },
  };

  try {
    storage.setItem(getCacheKey(product.slug), JSON.stringify(payload));
  } catch {
    // Ignore storage quota/private-mode failures. Prefetch still works.
  }
}

export function getCachedProductDetailSummary(
  slug: string
): CachedProductDetailSummary | null {
  const storage = getSessionStorage();
  if (!storage || !slug) return null;

  try {
    const raw = storage.getItem(getCacheKey(slug));
    if (!raw) return null;

    const payload = JSON.parse(raw) as Partial<CachedProductDetailPayload>;
    if (
      payload.version !== CACHE_VERSION ||
      !payload.cachedAt ||
      !payload.product ||
      Date.now() - payload.cachedAt > CACHE_TTL_MS
    ) {
      storage.removeItem(getCacheKey(slug));
      return null;
    }

    return payload.product;
  } catch {
    return null;
  }
}
