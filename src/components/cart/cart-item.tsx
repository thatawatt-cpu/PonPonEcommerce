"use client";

import { Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/product/product-image";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { Price } from "@/components/ui/price";
import { markProductDetailNavigation } from "@/features/products/product-detail-navigation";
import { getCartItemKey, useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/types/cart";

interface CartItemProps {
  item: CartItemType;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function CartItem({ item, checked = false, onCheckedChange }: CartItemProps) {
  const router = useRouter();
  const increase = useCartStore((s) => s.increaseQuantity);
  const decrease = useCartStore((s) => s.decreaseQuantity);
  const remove = useCartStore((s) => s.removeItem);

  const optionText = item.selectedOptions
    ? Object.values(item.selectedOptions).filter(Boolean).join(" · ")
    : null;
  const unitPrice = item.price;
  const itemKey = getCartItemKey(item);
  const editParams = new URLSearchParams({
    cartItemKey: itemKey,
    quantity: String(item.quantity),
  });
  if (item.selectedOptions) {
    editParams.set("options", JSON.stringify(item.selectedOptions));
  }
  const productPath = item.productSlug || item.productId;
  const productHref = `/products/${encodeURIComponent(productPath)}?${editParams.toString()}`;

  const openProduct = () => {
    markProductDetailNavigation();
    router.push(productHref);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Checkbox — outside the card */}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onCheckedChange?.(!checked);
        }}
        aria-label={checked ? "ยกเลิกการเลือก" : "เลือกสินค้า"}
        aria-pressed={checked}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition active:scale-90",
          checked ? "border-brand bg-brand" : "border-black/20"
        )}
      >
        {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </button>

      {/* Card */}
      <div
        role="link"
        tabIndex={0}
        onClick={openProduct}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProduct();
          }
        }}
        aria-label={`ดูรายละเอียด ${item.name}`}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/[0.06] transition hover:ring-brand/20 active:scale-[0.99]"
      >
        {/* Image */}
        <ProductImage
          imageUrl={item.imageUrl}
          emoji={item.emoji}
          size="sm"
          className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-xl"
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Name row + trash */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">
                {item.name}
              </h3>
              {optionText && (
                <p className="mt-0.5 text-xs font-medium text-ink-soft">{optionText}</p>
              )}
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                remove(itemKey);
              }}
              aria-label="ลบสินค้า"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft/30 transition hover:text-brand active:scale-90"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Price + quantity */}
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <Price value={unitPrice * item.quantity} size="sm" />
              <p className="mt-0.5 text-[10px] font-semibold text-ink-soft">
                ฿{unitPrice.toLocaleString("th-TH")} / ชิ้น
              </p>
            </div>
            <div onClick={(event) => event.stopPropagation()}>
              <QuantitySelector
                value={item.quantity}
                size="sm"
                min={1}
                onChange={(next) => {
                  if (next > item.quantity) {
                    increase(itemKey);
                  } else {
                    decrease(itemKey);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
