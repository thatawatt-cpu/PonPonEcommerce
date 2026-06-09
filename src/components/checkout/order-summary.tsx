import { ProductImage } from "@/components/product/product-image";
import { formatBaht } from "@/lib/format";
import type { CartItem } from "@/types/cart";

interface OrderSummaryProps {
  items: CartItem[];
}

/** Compact, read-only list of items for the checkout & confirmation views. */
export function OrderSummary({ items }: OrderSummaryProps) {
  return (
    <ul className="divide-y divide-black/5">
      {items.map((item) => {
        const optionText = item.selectedOptions
          ? Object.values(item.selectedOptions).join(" · ")
          : null;
        return (
          <li key={item.productId} className="flex items-center gap-3 py-2.5">
            <ProductImage
              emoji={item.emoji}
              size="sm"
              className="h-12 w-12 shrink-0 rounded-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {item.name}
              </p>
              <p className="text-xs text-ink-soft">
                {optionText ? `${optionText} · ` : ""}x{item.quantity}
              </p>
            </div>
            <span className="text-sm font-semibold text-ink">
              {formatBaht(item.price * item.quantity)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
