import { formatBaht } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  discountLabel?: string;
  total: number;
  className?: string;
}

export function CartSummary({
  subtotal,
  shippingFee,
  discountAmount = 0,
  discountLabel = "ส่วนลด",
  total,
  className,
}: CartSummaryProps) {
  return (
    <div className={cn("space-y-2 text-sm", className)}>
      <div className="flex justify-between text-ink-soft">
        <span>ราคาสินค้า</span>
        <span className="text-ink">{formatBaht(subtotal)}</span>
      </div>
      <div className="flex justify-between text-ink-soft">
        <span>ค่าจัดส่ง</span>
        <span className="text-ink">
          {shippingFee === 0 ? "ฟรี" : formatBaht(shippingFee)}
        </span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between font-bold text-success">
          <span>{discountLabel}</span>
          <span>-{formatBaht(discountAmount)}</span>
        </div>
      )}
      <div className="my-2 border-t border-dashed border-black/10" />
      <div className="flex items-center justify-between">
        <span className="font-semibold text-ink">ยอดรวมทั้งหมด</span>
        <span className="text-lg font-bold text-brand">
          {formatBaht(total)}
        </span>
      </div>
    </div>
  );
}
