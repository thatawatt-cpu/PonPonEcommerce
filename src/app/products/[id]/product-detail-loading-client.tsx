"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { ProductImage } from "@/components/product/product-image";
import { Price } from "@/components/ui/price";
import {
  getCachedProductDetailSummary,
  type CachedProductDetailSummary,
} from "@/features/products/product-detail-cache";
import { shouldScrollProductDetailToTop } from "@/features/products/product-detail-navigation";

function formatSoldCount(count?: number): string | null {
  if (!count || count <= 0) return null;
  if (count >= 10000) return `ขายได้ ${Math.floor(count / 1000)}พัน+`;
  if (count >= 1000) {
    const value = count / 1000;
    return `ขายได้ ${value.toFixed(value >= 10 ? 0 : 1)}พัน+`;
  }

  return `ขายได้ ${count.toLocaleString("th-TH")}`;
}

function getProductSlugFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const productIndex = segments.indexOf("products");
  const slug = productIndex >= 0 ? segments[productIndex + 1] : null;
  return slug ? decodeURIComponent(slug) : "";
}

function CachedProductHero({
  product,
}: {
  product: CachedProductDetailSummary;
}) {
  const soldCountLabel = formatSoldCount(product.soldCount);
  const ratingLabel =
    typeof product.rating === "number" ? product.rating.toFixed(1) : null;

  return (
    <div className="overflow-hidden rounded-card bg-white shadow-sm ring-1 ring-black/[0.04]">
      <ProductImage
        imageUrl={product.imageUrl}
        emoji={product.emoji}
        size="lg"
        priority
        className="aspect-square w-full md:aspect-[16/10]"
      />
      <div className="space-y-3 p-4">
        {product.badges.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {product.badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-extrabold text-brand"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        <h1 className="line-clamp-2 text-xl font-extrabold leading-snug text-ink">
          {product.name}
        </h1>

        <div className="flex items-center justify-between gap-3">
          <Price
            value={product.price}
            compareAt={product.compareAtPrice}
            size="lg"
          />
          <div className="text-right text-xs font-bold text-ink-soft">
            {ratingLabel ? <span>{ratingLabel} ดาว</span> : null}
            {ratingLabel && soldCountLabel ? <span> · </span> : null}
            {soldCountLabel ? <span>{soldCountLabel}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericProductHero() {
  return (
    <div className="rounded-card bg-white px-4 py-12 text-center shadow-sm ring-1 ring-black/[0.04]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <p className="mt-4 text-sm font-extrabold text-ink">กำลังเปิดสินค้า</p>
      <p className="mt-1 text-xs font-medium text-ink-soft">รอสักครู่</p>
    </div>
  );
}

function LoadingStatus() {
  return (
    <div className="mt-3 flex items-center justify-center gap-2 rounded-card bg-white/80 px-4 py-3 text-xs font-bold text-ink-soft ring-1 ring-black/[0.04]">
      <Loader2 className="h-4 w-4 animate-spin text-brand" />
      กำลังโหลดรายละเอียดสินค้า
    </div>
  );
}

export function ProductDetailLoadingClient() {
  const pathname = usePathname();
  const slug = getProductSlugFromPath(pathname);
  const cachedProduct = getCachedProductDetailSummary(slug);

  useLayoutEffect(() => {
    if (!shouldScrollProductDetailToTop()) return;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <>
      <AppHeader title={cachedProduct?.name ?? "สินค้า"} showBack />
      <PageContainer className="pb-40 pt-3 md:max-w-5xl md:px-8 xl:max-w-6xl">
        {cachedProduct ? (
          <CachedProductHero product={cachedProduct} />
        ) : (
          <GenericProductHero />
        )}

        <LoadingStatus />
      </PageContainer>
    </>
  );
}
