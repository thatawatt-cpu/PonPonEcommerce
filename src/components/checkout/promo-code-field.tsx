"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, X } from "lucide-react";

interface AppliedCouponDisplay {
  code: string;
  name: string;
  type: string;
  discountAmount: number;
}

interface PromoCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: (code: string) => void;
  appliedCoupons?: AppliedCouponDisplay[];
  couponCodeCount?: number;
  message?: string;
  error?: boolean;
  applying?: boolean;
}

function formatDiscountAmount(amount: number): string {
  return `${amount.toLocaleString("th-TH")} บาท`;
}

function getCouponDiscountText(coupon: AppliedCouponDisplay): string {
  if (coupon.type === "free_shipping") {
    return `ลดค่าส่ง ${formatDiscountAmount(coupon.discountAmount)}`;
  }

  return `ลด ${formatDiscountAmount(coupon.discountAmount)}`;
}

export function PromoCodeField({
  value,
  onChange,
  onApply,
  onRemove,
  appliedCoupons = [],
  couponCodeCount = appliedCoupons.length,
  message,
  error,
  applying = false,
}: PromoCodeFieldProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-ink-soft">
          กรอกโค้ด หรือเลือกจากคูปองที่มี
        </p>
        <Link
          href="/coupons?returnTo=checkout"
          className="flex shrink-0 items-center gap-0.5 text-xs font-extrabold text-brand"
        >
          เลือกคูปอง
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {appliedCoupons.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {appliedCoupons.map((coupon) => {
            const isFreeShipping = coupon.type === "free_shipping";

            return (
              <div
                key={coupon.code}
                className="flex min-h-12 items-center gap-2 rounded-2xl border border-black/[0.06] bg-white px-3 py-2 shadow-sm"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isFreeShipping
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-brand-soft text-brand"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-ink">
                    {coupon.name || coupon.code}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-bold uppercase text-ink-soft">
                    CODE {coupon.code}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-right text-xs font-extrabold ${
                    isFreeShipping ? "text-emerald-600" : "text-brand"
                  }`}
                >
                  {getCouponDiscountText(coupon)}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(coupon.code)}
                  aria-label={`ลบโค้ด ${coupon.code}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-soft transition active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {couponCodeCount < 2 && (
        <>
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") onApply();
              }}
              placeholder="เช่น SAVE100"
              className="h-11 min-w-0 flex-1 rounded-2xl border border-black/10 bg-[#fffaf8] px-4 text-sm font-bold uppercase text-ink outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
            />
            <button
              type="button"
              onClick={onApply}
              disabled={!value.trim() || applying}
              className="brand-button h-11 shrink-0 rounded-full px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              ใช้โค้ด
            </button>
          </div>
        </>
      )}

      {message && (
        <p
          className={`mt-2 text-xs font-bold ${
            error ? "text-brand" : "text-success"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
