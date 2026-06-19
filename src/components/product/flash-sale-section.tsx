"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Zap } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { getDiscountPercent } from "@/features/products/product-utils";
import { formatBaht } from "@/lib/format";
import type { Product } from "@/types/product";

function secondsUntilSlotEnd(slots: string[]): number {
  const now = new Date();
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  for (const slot of slots) {
    const [h, m] = slot.split(":").map(Number);
    const slotSec = h * 3600 + (m ?? 0) * 60;
    if (slotSec > nowSec) return slotSec - nowSec;
  }
  // last slot active — count down to midnight
  return 24 * 3600 - nowSec;
}

function Countdown({ slots }: { slots: string[] }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () => setSeconds(secondsUntilSlotEnd(slots));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  // slots มาจาก server props ไม่เปลี่ยนระหว่าง page lifetime
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

function FlashSaleItem({ product, priority = false }: { product: Product; priority?: boolean }) {
  const discount = getDiscountPercent(product) ?? 15;

  return (
    <article className="w-32 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(65,25,25,0.08)] ring-1 ring-black/[0.04] md:w-40">
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="relative">
          <ProductImage
            imageUrl={product.imageUrl}
            emoji={product.emoji}
            className="aspect-square w-full"
            priority={priority}
          />
          <span className="absolute left-1.5 top-1.5 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            -{discount}%
          </span>
        </div>
        <div className="px-2.5 pb-3.5 pt-2.5">
          <h3 className="truncate text-xs font-bold text-ink">
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-1">
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

function activeSlotIndex(slots: string[]): number {
  if (slots.length === 0) return 0;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let active = 0;
  for (let i = 0; i < slots.length; i++) {
    const [h, m] = slots[i].split(":").map(Number);
    if (nowMinutes >= h * 60 + (m ?? 0)) active = i;
  }
  return active;
}

export function FlashSaleSection({
  products,
  slots = ["09:00", "12:00", "15:00"],
}: {
  products: Product[];
  slots?: string[];
}) {
  const activeIdx = activeSlotIndex(slots);

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
        <Countdown slots={slots} />
      </div>

      <div className="rounded-t-[1.25rem] bg-[#fff8f6] pb-4 pt-3.5">
        <div className="mb-2 flex items-center justify-between px-3.5">
          <div className="flex gap-1.5 text-[10px] font-bold">
            {slots.map((slot, index) => (
              <span
                key={slot}
                className={
                  index === activeIdx
                    ? "rounded-full bg-brand px-2.5 py-1 text-white"
                    : "rounded-full bg-white px-2.5 py-1 text-ink-soft shadow-sm"
                }
              >
                {slot}
              </span>
            ))}
          </div>
          <Link
            href="/products"
            className="flex items-center text-[11px] font-bold text-brand"
          >
            ดูทั้งหมด
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-3.5 pb-1.5">
          {products.map((product, index) => (
            <FlashSaleItem key={product.id} product={product} priority={index < 2} />
          ))}
        </div>
      </div>
    </section>
  );
}
