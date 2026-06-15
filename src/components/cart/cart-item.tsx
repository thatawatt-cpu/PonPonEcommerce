"use client";

import { Trash2 } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { Price } from "@/components/ui/price";
import { getProductById } from "@/features/products/product-service";
import { useCartStore } from "@/store/cart-store";
import type { CartItem as CartItemType } from "@/types/cart";

export function CartItem({ item }: { item: CartItemType }) {
  const increase = useCartStore((s) => s.increaseQuantity);
  const decrease = useCartStore((s) => s.decreaseQuantity);
  const remove = useCartStore((s) => s.removeItem);

  const optionText = item.selectedOptions
    ? Object.values(item.selectedOptions).join(" · ")
    : null;
  const currentProduct = getProductById(item.productId);
  const displayName = currentProduct?.name ?? item.name;
  const displayImageUrl = currentProduct?.imageUrl ?? item.imageUrl;
  const displayEmoji = currentProduct?.emoji ?? item.emoji;
  const unitPrice = currentProduct?.price ?? item.price;

  return (
    <div className="flex gap-3 rounded-3xl bg-[#fff8f6] p-2.5 ring-1 ring-black/[0.03]">
      <ProductImage
        imageUrl={displayImageUrl}
        emoji={displayEmoji}
        size="sm"
        className="h-[5.5rem] w-[5.5rem] shrink-0 rounded-2xl shadow-sm"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
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
          <button
            type="button"
            onClick={() => remove(item.productId)}
            aria-label="ลบสินค้า"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink-soft shadow-sm transition hover:text-brand"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
              next > item.quantity
                ? increase(item.productId)
                : decrease(item.productId)
            }
          />
        </div>
      </div>
    </div>
  );
}
