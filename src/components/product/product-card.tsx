import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { ProductImage } from "@/components/product/product-image";
import type { Product } from "@/types/product";

function formatSoldCount(count?: number): string | null {
  if (!count || count <= 0) return null;
  if (count >= 10000) return `ขายได้ ${Math.floor(count / 1000)}พัน+`;
  if (count >= 1000) {
    const value = count / 1000;
    return `ขายได้ ${value.toFixed(value >= 10 ? 0 : 1)}พัน+`;
  }

  return `ขายได้ ${count.toLocaleString("th-TH")}`;
}

function getDiscountPercent(product: Product) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return null;
  return Math.round(
    ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
  );
}

function getMockReview(product: Product): string {
  const seed = product.id
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (4.7 + (seed % 3) / 10).toFixed(1);
}

export function ProductCard({
  product,
  index = 0,
  metaLabel,
}: {
  product: Product;
  /** Used to stagger the entrance animation in a grid. */
  index?: number;
  /** Optional contextual label shown over the product image. */
  metaLabel?: string;
}) {
  const discountPercent = getDiscountPercent(product);
  const soldCountLabel = formatSoldCount(product.soldCount);
  const reviewLabel = getMockReview(product);
  const visibleBadges = product.badges
    .filter((badge) => badge !== "ลดราคา" || discountPercent === null)
    .slice(0, discountPercent === null ? 2 : 1);

  return (
    <Card
      className="cv-auto group flex h-full animate-fade-up flex-col overflow-hidden transition active:scale-[0.98] motion-reduce:active:scale-100"
      style={{ animationDelay: `${Math.min(index, 9) * 55}ms` }}
    >
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative overflow-hidden">
          <ProductImage
            imageUrl={product.imageUrl}
            emoji={product.emoji}
            className="aspect-[1.12/1] w-full transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex max-w-[48%] flex-col items-start gap-1.5">
            {discountPercent !== null ? (
              <span className="rounded-lg bg-brand px-2 py-1 text-[11px] font-extrabold leading-none text-white shadow-[0_5px_12px_rgba(190,9,14,0.22)]">
                -{discountPercent}%
              </span>
            ) : null}
            {visibleBadges.length > 0 ? (
              <div className="flex max-w-full items-center gap-1.5">
                {visibleBadges.map((b) => (
                  <Badge
                    key={b}
                    label={b}
                    className="shrink-0 rounded-full border border-white/80 px-2 py-1 text-[10px] font-extrabold shadow-[0_3px_9px_rgba(65,25,25,0.14)] "
                  />
                ))}
              </div>
            ) : null}
          </div>
          {metaLabel ? (
            <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full border border-white/75 bg-white px-2 py-1 text-[10px] font-extrabold text-ink-soft shadow-[0_4px_12px_rgba(65,25,25,0.12)] ">
              {metaLabel}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-ink">
            {product.name}
          </h3>
          <div className="mt-auto flex items-end justify-between gap-1.5 pt-2">
            <Price
              value={product.price}
              compareAt={product.compareAtPrice}
              size="sm"
              className="min-w-0 shrink-0 gap-1"
            />
            <div className="ml-auto flex items-center justify-end">
              <span className="product-card-action flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
          <div className="mt-1.5 flex min-h-5 items-center gap-1.5 text-[11px] font-bold text-ink-soft">
            <span className="inline-flex items-center gap-0.5 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {reviewLabel}
            </span>
            {soldCountLabel ? (
              <>
                <span className="h-1 w-1 rounded-full bg-ink-soft/35" />
                <span className="min-w-0 truncate">{soldCountLabel}</span>
              </>
            ) : null}
          </div>
        </div>
      </Link>
    </Card>
  );
}
