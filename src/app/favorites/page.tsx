"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { ProductImage } from "@/components/product/product-image";
import { Price } from "@/components/ui/price";
import { Card } from "@/components/ui/card";
import { mapApiShopProductToProduct } from "@/features/products/product-mapper";
import {
  fetchWishlist,
  removeWishlistProduct,
} from "@/features/customers/customer-engagement-api";
import {
  useFavoriteStore,
  useFavoritesHydrated,
} from "@/store/favorite-store";
import type { Product } from "@/types/product";

export default function FavoritesPage() {
  const hydrated = useFavoritesHydrated();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const favoriteProductIds = useFavoriteStore((state) => state.productIds);
  const setFavoriteProductIds = useFavoriteStore(
    (state) => state.setFavoriteProductIds
  );
  const favoriteProducts = useMemo(
    () =>
      products.filter((product) => favoriteProductIds.includes(product.id)),
    [favoriteProductIds, products],
  );

  useEffect(() => {
    let cancelled = false;

    fetchWishlist()
      .then((data) => {
        if (cancelled) return;
        setFavoriteProductIds(data.productIds);
        setProducts(data.products.map(mapApiShopProductToProduct));
      })
      .catch((error: unknown) => {
        console.error("[favorites] Failed to load products", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setFavoriteProductIds]);

  const handleRemoveFavorite = (product: Product) => {
    const previousIds = favoriteProductIds;
    const previousProducts = products;
    setFavoriteProductIds(previousIds.filter((id) => id !== product.id));
    setProducts((current) => current.filter((item) => item.id !== product.id));

    removeWishlistProduct(product.id)
      .then((data) => {
        if (!data) return;
        setFavoriteProductIds(data.productIds);
        setProducts(data.products.map(mapApiShopProductToProduct));
      })
      .catch((error: unknown) => {
        console.error("[favorites] Failed to remove product", error);
        setFavoriteProductIds(previousIds);
        setProducts(previousProducts);
      });
  };

  return (
    <>
      <AppHeader title="สินค้าที่ถูกใจ" showBack />
      <PageContainer className="space-y-4 pt-4">
        <Card className="flex items-center justify-between gap-4 p-4">
          <div>
            <h1 className="text-lg font-extrabold text-ink">
              รายการโปรดของฉัน
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              เก็บสินค้าที่สนใจไว้ แล้วกลับมาสั่งซื้อได้ง่ายขึ้น
            </p>
          </div>
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-brand-soft text-brand">
            <Heart className="h-6 w-6 fill-current" />
            {hydrated && favoriteProducts.length > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1 text-xs font-extrabold text-white ring-2 ring-white">
                {favoriteProducts.length}
              </span>
            ) : null}
          </span>
        </Card>

        {!hydrated || loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-card bg-white/70"
              />
            ))}
          </div>
        ) : favoriteProducts.length > 0 ? (
          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold text-ink">
                สินค้าที่บันทึกไว้
              </h2>
              <span className="text-[11px] font-bold text-ink-soft">
                {favoriteProducts.length} รายการ
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {favoriteProducts.map((product) => (
                <Card
                  key={product.id}
                  className="flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <ProductImage
                      imageUrl={product.imageUrl}
                      emoji={product.emoji}
                      size="sm"
                      className="h-24 w-24 shrink-0 rounded-2xl"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm font-extrabold leading-snug text-ink">
                        {product.name}
                      </span>
                      <span className="mt-1 block text-[11px] font-semibold text-ink-soft">
                        {product.categoryName}
                      </span>
                      <Price
                        value={product.price}
                        compareAt={product.compareAtPrice}
                        size="sm"
                        className="mt-2"
                      />
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(product)}
                    aria-label={`นำ ${product.name} ออกจากรายการโปรด`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-[0_7px_18px_rgba(190,9,14,0.22)] transition hover:bg-brand-dark active:scale-90"
                  >
                    <Heart className="h-5 w-5 fill-current" />
                  </button>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          <Card className="px-4 py-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Heart className="h-8 w-8" />
            </span>
            <h2 className="mt-4 text-base font-extrabold text-ink">
              ยังไม่มีสินค้าที่ถูกใจ
            </h2>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-ink-soft">
              กดปุ่มหัวใจบนหน้ารายละเอียดสินค้า แล้วสินค้าจะมาอยู่ที่หน้านี้
            </p>
            <Link
              href="/products"
              className="brand-button mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold text-white"
            >
              <ShoppingBag className="h-4 w-4" />
              เลือกดูสินค้า
            </Link>
          </Card>
        )}
      </PageContainer>
    </>
  );
}
