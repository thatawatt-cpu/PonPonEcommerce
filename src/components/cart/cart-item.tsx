"use client";

import { Trash2 } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { Price } from "@/components/ui/price";
import { useCartStore } from "@/store/cart-store";
import type { CartItem as CartItemType } from "@/types/cart";

export function CartItem({ item }: { item: CartItemType }) {
  const increase = useCartStore((s) => s.increaseQuantity);
  const decrease = useCartStore((s) => s.decreaseQuantity);
  const remove = useCartStore((s) => s.removeItem);

  const optionText = item.selectedOptions
    ? Object.values(item.selectedOptions).join(" · ")
    : null;

  return (
    <div className="flex gap-3 py-3">
      <ProductImage
        emoji={item.emoji}
        size="sm"
        className="h-20 w-20 shrink-0 rounded-xl"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-ink">
            {item.name}
          </h3>
          <button
            type="button"
            onClick={() => remove(item.productId)}
            aria-label="ลบสินค้า"
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-surface-muted hover:text-brand"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {optionText && (
          <p className="mt-0.5 text-xs text-ink-soft">{optionText}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <Price value={item.price * item.quantity} size="sm" />
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
