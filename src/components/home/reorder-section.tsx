"use client";

import Link from "next/link";
import { ArrowUpRight, History } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { markProductDetailNavigation } from "@/features/products/product-detail-navigation";
import { formatBaht } from "@/lib/format";
import type { Product } from "@/types/product";

export function ReorderSection({ products }: { products: Product[] }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="promo-section-title flex items-center gap-1.5">
          <History className="h-5 w-5 text-brand" />
          ซื้ออีกครั้ง
        </h2>
        <Link
          href="/orders?filter=completed"
          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand shadow-sm"
        >
          ดูประวัติ
        </Link>
      </div>

      <div className="no-scrollbar -mx-3.5 flex gap-2.5 overflow-x-auto px-3.5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:px-0">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            scroll
            onClick={markProductDetailNavigation}
            className="home-panel-shadow group flex min-w-64 items-center gap-3 rounded-card bg-white p-2.5 ring-1 ring-black/[0.04] md:min-w-0"
          >
            <ProductImage
              imageUrl={product.imageUrl}
              emoji={product.emoji}
              size="sm"
              className="h-18 w-18 shrink-0 rounded-2xl"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">
                {product.name}
              </p>
              <p className="mt-1 text-sm font-extrabold text-brand">
                {formatBaht(product.price)}
              </p>
              <span className="reorder-action mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-brand transition">
                ซื้ออีกครั้ง
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
