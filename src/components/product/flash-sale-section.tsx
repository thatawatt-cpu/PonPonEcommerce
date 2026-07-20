"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Zap } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { markProductDetailNavigation } from "@/features/products/product-detail-navigation";
import { getDiscountPercent } from "@/features/products/product-utils";
import { formatBaht } from "@/lib/format";
import type { Product } from "@/types/product";

type SlotRange = {
  startSec: number;
  endSec: number;
  crossesMidnight: boolean;
};

const bangkokTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok",
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function getBangkokNowSeconds(): number {
  const parts = Object.fromEntries(
    bangkokTimeFormatter
      .formatToParts(new Date())
      .map((part) => [part.type, part.value])
  );
  const hours = Number(parts.hour);
  const minutes = Number(parts.minute);
  const seconds = Number(parts.second);
  const normalizedHours = hours === 24 ? 0 : hours;

  return normalizedHours * 3600 + minutes * 60 + seconds;
}

function parseSlotTime(value: string): number | null {
  const [hours, minutes = "0"] = value.trim().split(":");
  const h = Number(hours);
  const m = Number(minutes);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 3600 + m * 60;
}

function parseSlot(slot: string): SlotRange | null {
  const [startRaw, endRaw] = slot.split("-", 2);
  const startSec = parseSlotTime(startRaw);
  if (startSec === null) return null;

  const endSec = endRaw ? parseSlotTime(endRaw) : null;
  return {
    startSec,
    endSec: endSec ?? 24 * 3600 - 1,
    crossesMidnight: endSec !== null && startSec > endSec,
  };
}

function isNowInSlot(slot: SlotRange, nowSec: number): boolean {
  return slot.crossesMidnight
    ? nowSec >= slot.startSec || nowSec < slot.endSec
    : slot.startSec <= nowSec && nowSec < slot.endSec;
}

function secondsUntilSlotEnd(slots: string[]): number {
  const nowSec = getBangkokNowSeconds();
  const parsedSlots = slots.map(parseSlot).filter((slot): slot is SlotRange => slot !== null);
  const activeSlot = parsedSlots.find((slot) => isNowInSlot(slot, nowSec));
  if (activeSlot) {
    if (activeSlot.crossesMidnight && nowSec >= activeSlot.startSec) {
      return 24 * 3600 - nowSec + activeSlot.endSec;
    }

    return Math.max(0, activeSlot.endSec - nowSec);
  }

  return 0;
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
    <article className="home-panel-shadow w-32 shrink-0 snap-start overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.04] md:w-40 lg:w-44">
      <Link
        href={`/products/${product.slug}`}
        onClick={markProductDetailNavigation}
        className="group block"
      >
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
  const nowSec = getBangkokNowSeconds();
  const active = slots.findIndex((slot) => {
    const parsed = parseSlot(slot);
    return parsed ? isNowInSlot(parsed, nowSec) : false;
  });
  return active >= 0 ? active : 0;
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
    <section className="home-red-panel-shadow mt-4 overflow-hidden rounded-card bg-brand">
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
            href="/products?flashSale=1"
            className="flex items-center text-[11px] font-bold text-brand"
          >
            ดูทั้งหมด
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth px-3.5 pb-1.5">
          {products.map((product, index) => (
            <FlashSaleItem key={product.id} product={product} priority={index < 2} />
          ))}
        </div>
      </div>
    </section>
  );
}
