import "server-only";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";
import { getActiveFlashSaleServer } from "@/features/flash-sales/flash-sales-service.server";
import {
  buildFlashSaleProducts,
  mergeFlashSaleProducts,
} from "@/features/flash-sales/flash-sale-products";
import {
  mapApiCategoryToCategory,
  mapApiProductDetailToProduct,
  mapApiShopProductToProduct,
} from "./product-mapper";
import type { Category } from "@/types/common";
import type { Product } from "@/types/product";
import type {
  ApiCategory,
  ApiCouponListItem,
  ApiResolvedProductPrice,
  ApiShopProductDetailResponse,
  ApiShopProductListItem,
} from "@/types/api";

const ALL_CATEGORY: Category = { id: "all", name: "ทั้งหมด", emoji: "🛍️" };

export interface ProductDetailServerData {
  product: Product;
  availableCoupons: ApiCouponListItem[];
  relatedProducts: Product[];
}

function getArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function applyResolvedPrice(
  product: Product,
  resolvedPrice?: ApiResolvedProductPrice | null
): Product {
  if (!resolvedPrice || typeof resolvedPrice.displayPrice !== "number") {
    return product;
  }

  return {
    ...product,
    price: resolvedPrice.displayPrice,
    compareAtPrice:
      resolvedPrice.displayOriginalPrice &&
      resolvedPrice.displayOriginalPrice > resolvedPrice.displayPrice
        ? resolvedPrice.displayOriginalPrice
        : undefined,
    priceSource: resolvedPrice.priceSource,
    activeFlashSaleId: resolvedPrice.activeFlashSaleId,
  };
}

async function applyActiveFlashSalePrices(
  products: Product[],
  options: { includeMissing?: boolean } = {}
): Promise<Product[]> {
  if (products.length === 0) return products;

  const activeFlashSale = await getActiveFlashSaleServer();
  const flashSaleProducts = buildFlashSaleProducts(products, activeFlashSale);
  return mergeFlashSaleProducts(products, flashSaleProducts, options);
}

async function mapShopProductDetail(
  data: ApiShopProductDetailResponse | null
): Promise<ProductDetailServerData | null> {
  if (!data?.product) return null;

  const product = applyResolvedPrice(
    mapApiProductDetailToProduct(data.product),
    data.resolvedPrice
  );
  const relatedProducts = getArray(data.relatedProducts).map(
    mapApiShopProductToProduct
  );
  const mergedProducts = await applyActiveFlashSalePrices(
    [product, ...relatedProducts],
    { includeMissing: false }
  );

  return {
    product: mergedProducts[0] ?? product,
    availableCoupons: getArray(data.availableCoupons),
    relatedProducts: mergedProducts.slice(1),
  };
}

export async function getAllProductsServer(params?: {
  keyword?: string;
  category?: string;
  pageSize?: number;
}): Promise<Product[]> {
  try {
    const url = new URL(`${PONPON_BACKEND_BASE_URL}/api/shop/products`);
    if (params?.keyword) url.searchParams.set("keyword", params.keyword);
    if (params?.category && params.category !== "all")
      url.searchParams.set("category", params.category);
    url.searchParams.set("pageSize", String(params?.pageSize ?? 100));

    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return [];

    const data: ApiShopProductListItem[] = await res.json();
    const products = Array.isArray(data)
      ? data.map(mapApiShopProductToProduct)
      : [];
    return applyActiveFlashSalePrices(products);
  } catch (err) {
    console.error("[products] getAllProductsServer failed:", err);
    return [];
  }
}

export async function getProductByIdServer(
  id: string
): Promise<Product | null> {
  const detail = await getProductDetailByIdServer(id);
  return detail?.product ?? null;
}

export async function getProductDetailByIdServer(
  id: string
): Promise<ProductDetailServerData | null> {
  try {
    const url = new URL(
      `${PONPON_BACKEND_BASE_URL}/api/shop/products/${id}/detail`
    );
    url.searchParams.set("salesChannel", "line_liff");
    url.searchParams.set("relatedProductLimit", "8");

    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as
      | ApiShopProductDetailResponse
      | null;
    return mapShopProductDetail(data);
  } catch (err) {
    console.error("[products] getProductDetailByIdServer failed:", err);
    return null;
  }
}

export async function getProductBySlugServer(
  slug: string
): Promise<Product | null> {
  const detail = await getProductDetailBySlugServer(slug);
  return detail?.product ?? null;
}

export async function getProductDetailBySlugServer(
  slug: string
): Promise<ProductDetailServerData | null> {
  try {
    const url = new URL(
      `${PONPON_BACKEND_BASE_URL}/api/shop/products/slug/${encodeURIComponent(slug)}/detail`
    );
    url.searchParams.set("salesChannel", "line_liff");
    url.searchParams.set("relatedProductLimit", "8");

    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as
      | ApiShopProductDetailResponse
      | null;
    return mapShopProductDetail(data);
  } catch (err) {
    console.error("[products] getProductDetailBySlugServer failed:", err);
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
