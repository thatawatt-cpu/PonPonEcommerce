"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/product/product-image";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { Price } from "@/components/ui/price";
import { getCartItemKey, useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/types/cart";

const SWIPE_ACTION_WIDTH = 76;
const SWIPE_OPEN_THRESHOLD = 38;

export function CartItem({ item }: { item: CartItemType }) {
  const router = useRouter();
  const increase = useCartStore((s) => s.increaseQuantity);
  const decrease = useCartStore((s) => s.decreaseQuantity);
  const remove = useCartStore((s) => s.removeItem);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeStart = useRef<{ x: number; y: number; offset: number } | null>(
    null
  );
  const isSwiping = useRef(false);
  const suppressNextClick = useRef(false);

  const optionText = item.selectedOptions
    ? Object.values(item.selectedOptions).join(" · ")
    : null;
  const displayName = item.name;
  const displayImageUrl = item.imageUrl;
  const displayEmoji = item.emoji;
  const unitPrice = item.price;
  const itemKey = getCartItemKey(item);

  const closeSwipe = () => setSwipeOffset(0);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    swipeStart.current = {
      x: event.clientX,
      y: event.clientY,
      offset: swipeOffset,
    };
    isSwiping.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    if (!isSwiping.current && Math.abs(deltaX) <= Math.abs(deltaY)) return;

    isSwiping.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);

    const nextOffset = Math.min(
      0,
      Math.max(-SWIPE_ACTION_WIDTH, start.offset + deltaX)
    );
    setSwipeOffset(nextOffset);
  };

  const handlePointerUp = () => {
    if (!swipeStart.current) return;

    suppressNextClick.current = isSwiping.current;
    setSwipeOffset((current) =>
      current <= -SWIPE_OPEN_THRESHOLD ? -SWIPE_ACTION_WIDTH : 0
    );
    swipeStart.current = null;
    isSwiping.current = false;
  };

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }

    if ((event.target as HTMLElement).closest("button,a")) return;

    if (swipeOffset < 0) {
      closeSwipe();
      return;
    }

    router.push(`/products/${item.productId}`);
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    router.push(`/products/${item.productId}`);
  };

  return (
    <div className="overflow-hidden rounded-3xl shadow-sm">
      <div
        className="group flex touch-pan-y transition-transform duration-150"
        data-open={swipeOffset < 0}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          role="link"
          tabIndex={0}
          aria-label={`ดูรายละเอียด ${displayName}`}
          className="flex w-full shrink-0 cursor-pointer gap-3 rounded-3xl bg-[#fff8f6] p-2.5 ring-1 ring-black/[0.03] transition-[border-radius] duration-150 group-data-[open=true]:rounded-r-none"
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
        >
          <ProductImage
            imageUrl={displayImageUrl}
            emoji={displayEmoji}
            size="sm"
            className="h-[5.5rem] w-[5.5rem] shrink-0 rounded-2xl shadow-sm"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-ink">
                {displayName}
              </h3>
              {optionText && (
                <p className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-bold text-ink-soft shadow-sm">
                  {optionText}
                </p>
              )}
            </div>

            <div className="mt-auto flex items-end justify-between gap-2 pt-3">
              <div>
                <Price value={unitPrice * item.quantity} size="sm" />
                <p className="mt-0.5 text-[10px] font-semibold text-ink-soft">
                  ฿{unitPrice.toLocaleString("th-TH")} / ชิ้น
                </p>
              </div>
              <QuantitySelector
                value={item.quantity}
                size="sm"
                min={1}
                onChange={(next) =>
                  next > item.quantity ? increase(itemKey) : decrease(itemKey)
                }
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => remove(itemKey)}
          aria-label="ลบสินค้า"
          className={cn(
            "-ml-px flex w-[77px] shrink-0 items-center justify-center rounded-l-none rounded-r-3xl bg-brand text-white transition-opacity duration-100",
            swipeOffset === 0 && "pointer-events-none opacity-0"
          )}
          aria-hidden={swipeOffset === 0}
        >
          <span className="flex flex-col items-center gap-1 text-[11px] font-extrabold">
            <Trash2 className="h-5 w-5" />
            ลบ
          </span>
        </button>
      </div>
    </div>
  );
}
