import "server-only";
import { PONPON_BACKEND_BASE_URL } from "@/lib/server/api-backend";
import { mapApiShopProductToProduct } from "@/features/products/product-mapper";
import type {
  ApiCouponListItem,
  ApiFlashSale,
  ApiHomeSlide,
  ApiShopHomeResponse,
} from "@/types/api";
import type { Product } from "@/types/product";

interface ShopHomeData {
  slides: ApiHomeSlide[];
  flashSale: ApiFlashSale | null;
  featuredProducts: Product[];
  availableCoupons: ApiCouponListItem[];
}

function getArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export async function getShopHomeServer(params?: {
  salesChannel?: string;
  featuredProductLimit?: number;
}): Promise<ShopHomeData> {
  try {
    const url = new URL(`${PONPON_BACKEND_BASE_URL}/api/shop/home`);
    url.searchParams.set("salesChannel", params?.salesChannel ?? "line_liff");
    url.searchParams.set(
      "featuredProductLimit",
      String(params?.featuredProductLimit ?? 12)
    );

    const res = await fetch(url.toString(), { next: { revalidate: 30 } });
    if (!res.ok) {
      return {
        slides: [],
        flashSale: null,
        featuredProducts: [],
        availableCoupons: [],
      };
    }

    const data = (await res.json().catch(() => null)) as
      | ApiShopHomeResponse
      | null;

    return {
      slides: getArray(data?.slides),
      flashSale: data?.flashSale ?? null,
      featuredProducts: getArray(data?.featuredProducts).map(
        mapApiShopProductToProduct
      ),
      availableCoupons: getArray(data?.availableCoupons),
    };
  } catch (err) {
    console.error("[shop-home] getShopHomeServer failed:", err);
    return {
      slides: [],
      flashSale: null,
      featuredProducts: [],
      availableCoupons: [],
    };
  }
}
