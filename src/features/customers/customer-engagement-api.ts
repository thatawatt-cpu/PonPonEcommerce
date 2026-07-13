"use client";

import { ponponFetch } from "@/features/auth/ponpon-auth";
import type {
  ApiCustomerWishlistResponse,
  ApiRecentlyViewedResponse,
} from "@/types/api";

function normalizeProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const data = await response.json().catch(() => null);
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};
}

export async function fetchWishlist(): Promise<ApiCustomerWishlistResponse> {
  const response = await ponponFetch("/api/customers/me/wishlist", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Wishlist request failed with status ${response.status}`);
  }

  const data = await readJson(response);
  return {
    productIds: normalizeProductIds(data.productIds),
    products: normalizeArray(data.products),
  };
}

export async function addWishlistProduct(
  productId: string
): Promise<ApiCustomerWishlistResponse | null> {
  const response = await ponponFetch(
    `/api/customers/me/wishlist/${encodeURIComponent(productId)}`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error(`Add wishlist failed with status ${response.status}`);
  }

  const data = await readJson(response);
  if (!("productIds" in data) && !("products" in data)) return null;
  return {
    productIds: normalizeProductIds(data.productIds),
    products: normalizeArray(data.products),
  };
}

export async function removeWishlistProduct(
  productId: string
): Promise<ApiCustomerWishlistResponse | null> {
  const response = await ponponFetch(
    `/api/customers/me/wishlist/${encodeURIComponent(productId)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error(`Remove wishlist failed with status ${response.status}`);
  }

  const data = await readJson(response);
  if (!("productIds" in data) && !("products" in data)) return null;
  return {
    productIds: normalizeProductIds(data.productIds),
    products: normalizeArray(data.products),
  };
}

export async function fetchRecentlyViewed(): Promise<ApiRecentlyViewedResponse> {
  const response = await ponponFetch("/api/customers/me/recently-viewed", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `Recently viewed request failed with status ${response.status}`
    );
  }

  const data = await readJson(response);
  return {
    items: normalizeArray(data.items),
    products: normalizeArray(data.products),
  };
}

export async function recordRecentlyViewed(input: {
  productId: string;
  viewedAtUtc?: string;
}): Promise<void> {
  const response = await ponponFetch("/api/customers/me/recently-viewed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      `Record recently viewed failed with status ${response.status}`
    );
  }
}
