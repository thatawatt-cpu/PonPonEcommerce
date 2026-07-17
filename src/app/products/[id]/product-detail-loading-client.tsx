"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { ProductImage } from "@/components/product/product-image";
import { Price } from "@/components/ui/price";
import {
  getCachedProductDetailSummary,
  type CachedProductDetailSummary,
} from "@/features/products/product-detail-cache";

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-surface-muted ${className}`}
    />
  );
}

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
        ) : (
          <SkeletonLine className="h-4 w-24 bg-brand/15" />
        )}

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
    <div className="overflow-hidden rounded-card bg-white shadow-sm ring-1 ring-black/[0.04]">
      <div className="aspect-square w-full animate-pulse bg-surface-muted md:aspect-[16/10]" />
      <div className="space-y-3 p-4">
        <SkeletonLine className="h-4 w-24 bg-brand/15" />
        <SkeletonLine className="h-6 w-4/5" />
        <SkeletonLine className="h-6 w-2/3" />
        <div className="flex items-center justify-between gap-3 pt-1">
          <SkeletonLine className="h-8 w-28 bg-brand/15" />
          <SkeletonLine className="h-7 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailLoadingClient() {
  const pathname = usePathname();
  const slug = getProductSlugFromPath(pathname);
  const cachedProduct = getCachedProductDetailSummary(slug);

  return (
    <>
      <AppHeader title={cachedProduct?.name ?? "สินค้า"} showBack />
      <PageContainer className="pb-40 pt-3 md:max-w-5xl md:px-8 xl:max-w-6xl">
        {cachedProduct ? (
          <CachedProductHero product={cachedProduct} />
        ) : (
          <GenericProductHero />
        )}

        <div className="mt-3 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square animate-pulse rounded-2xl bg-white/80 ring-1 ring-black/[0.04]"
            />
          ))}
        </div>

        <div className="mt-3 space-y-3 rounded-card bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-11 w-full rounded-2xl" />
          <SkeletonLine className="h-11 w-full rounded-2xl" />
        </div>

        <div className="mt-3 space-y-3 rounded-card bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <SkeletonLine className="h-4 w-28" />
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-11/12" />
          <SkeletonLine className="h-3 w-3/4" />
        </div>
      </PageContainer>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.05] bg-white/95 px-3.5 py-3 shadow-[0_-10px_30px_rgba(65,25,25,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-md gap-2 md:max-w-3xl">
          <div className="h-12 flex-1 animate-pulse rounded-2xl bg-brand/10" />
          <div className="h-12 flex-[1.2] animate-pulse rounded-2xl bg-brand/20" />
        </div>
      </div>
    </>
  );
}
