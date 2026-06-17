import { ProductImage } from "@/components/product/product-image";
import { formatBaht } from "@/lib/format";
import type { PromotionResult } from "@/lib/promotions";
import { getCartItemKey } from "@/store/cart-store";
import type { CartItem } from "@/types/cart";

interface OrderSummaryProps {
  items: CartItem[];
  promotion?: PromotionResult;
}

/** Compact, read-only list of items for the checkout & confirmation views. */
export function OrderSummary({ items, promotion }: OrderSummaryProps) {
  const scopeLabel =
    promotion?.scope === "shipping"
      ? "ลดค่าจัดส่ง"
      : promotion?.scope === "bundle"
        ? "คูปองชุดสินค้า"
        : promotion?.scope === "product"
          ? "คูปองเฉพาะสินค้า"
          : "คูปองทั้งออเดอร์";
  const promotionDescription =
    promotion?.scope === "shipping"
      ? "คูปองนี้ลดเฉพาะค่าจัดส่ง ราคาสินค้าไม่เปลี่ยน"
      : promotion?.scope === "order"
        ? "ส่วนลดถูกหักจากยอดรวมทั้งออเดอร์ ไม่ได้ผูกกับสินค้ารายการใดรายการหนึ่ง"
        : promotion?.scope === "bundle"
          ? "ส่วนลดนี้ใช้เฉพาะสินค้าที่อยู่ในชุดตามเงื่อนไข"
          : promotion?.scope === "product"
            ? "ส่วนลดนี้ใช้กับสินค้าที่กำหนดเท่านั้น"
            : undefined;

  return (
    <div>
      {promotion?.code && promotionDescription && (
        <div className="mb-2 rounded-2xl border border-success/15 bg-success-soft px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-success">
              ใช้โค้ด {promotion.code}
            </p>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-success">
              {scopeLabel}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
            {promotionDescription}
          </p>
        </div>
      )}

      <ul className="divide-y divide-black/5">
        {items.map((item) => {
          const productDiscountApplies =
            promotion?.eligibleProductIds.includes(item.productId) ?? false;
          const optionText = item.selectedOptions
            ? Object.values(item.selectedOptions).join(" · ")
            : null;
          return (
            <li
              key={getCartItemKey(item)}
              className="flex items-center gap-3 py-2.5"
            >
              <ProductImage
                imageUrl={item.imageUrl}
                emoji={item.emoji}
                size="sm"
                className="h-12 w-12 shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {item.name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <p className="text-xs text-ink-soft">
                    {optionText ? `${optionText} · ` : ""}x{item.quantity}
                  </p>
                  {productDiscountApplies && (
                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-[9px] font-extrabold text-success">
                      ร่วมคำนวณส่วนลด
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm font-semibold text-ink">
                {formatBaht(item.price * item.quantity)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
