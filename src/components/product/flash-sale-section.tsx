"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Zap } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { getDiscountPercent } from "@/features/products/product-utils";
import { formatBaht } from "@/lib/format";
import type { Product } from "@/types/product";

const INITIAL_SECONDS = 2 * 60 * 60 + 45 * 60 + 18;

function Countdown() {
  const [seconds, setSeconds] = useState(INITIAL_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => (current > 0 ? current - 1 : INITIAL_SECONDS));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const values = [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ];

  return (
    <div className="flex items-center gap-1" aria-label="เวลาที่เหลือ">
      {values.map((value, index) => (
        <span key={index} className="contents">
          <span className="min-w-7 rounded-md bg-white px-1.5 py-1 text-center text-xs font-extrabold tabular-nums text-brand shadow-sm">
            {String(value).padStart(2, "0")}
          </span>
          {index < values.length - 1 && (
            <span className="text-xs font-extrabold text-white/80">:</span>
          )}
        </span>
      ))}
    </div>
  );
}

function FlashSaleItem({ product }: { product: Product }) {
  const discount = getDiscountPercent(product) ?? 15;

  return (
    <article className="w-32 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] md:w-40">
      <Link href={`/products/${product.id}`} className="group block">
        <div className="relative">
          <ProductImage
            imageUrl={product.imageUrl}
            emoji={product.emoji}
            className="aspect-square w-full"
          />
          <span className="absolute left-1.5 top-1.5 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            -{discount}%
          </span>
        </div>
        <div className="px-2.5 pb-2.5 pt-2">
          <h3 className="truncate text-xs font-bold text-ink">
            {product.name}
          </h3>
          <div className="mt-1 flex items-end justify-between gap-1">
            <div className="flex min-w-0 items-baseline gap-1">
              <span className="text-sm font-extrabold text-brand">
                {formatBaht(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="truncate text-[10px] text-ink-soft line-through">
                  {formatBaht(product.compareAtPrice)}
                </span>
              )}
            </div>
            <span className="product-card-action flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function FlashSaleSection({ products }: { products: Product[] }) {
  return (
    <section className="mt-4 overflow-hidden rounded-card bg-brand shadow-[0_12px_28px_rgba(190,9,14,0.2)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1 text-lg font-extrabold leading-none">
            <Zap className="h-5 w-5 fill-white" />
            Flash Sale
          </h2>
          <p className="mt-1 text-[10px] font-semibold text-white/75">
            ดีลแรง หมดเวลาแล้วราคากลับทันที
          </p>
        </div>
        <Countdown />
      </div>

      <div className="rounded-t-[1.25rem] bg-[#fff8f6] pb-3 pt-3">
        <div className="mb-2 flex items-center justify-between px-3.5">
          <div className="flex gap-1.5 text-[10px] font-bold">
            <span className="rounded-full bg-brand px-2.5 py-1 text-white">
              09:00
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-ink-soft shadow-sm">
              12:00
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-ink-soft shadow-sm">
              15:00
            </span>
          </div>
          <Link
            href="/products"
            className="flex items-center text-[11px] font-bold text-brand"
          >
            ดูทั้งหมด
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-3.5">
          {products.map((product) => (
            <FlashSaleItem key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
