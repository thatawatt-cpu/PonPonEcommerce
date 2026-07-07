"use client";

import Link from "next/link";
import { ChevronRight, MoreVertical } from "lucide-react";

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

function getCouponValueText(coupon: AppliedCouponDisplay): string {
  if (coupon.type === "free_shipping") return "ส่งฟรี";
  if (coupon.type === "percentage") return `${coupon.discountAmount}%`;
  return `฿${coupon.discountAmount.toLocaleString("th-TH")}`;
}

function getCouponValueHint(coupon: AppliedCouponDisplay): string {
  if (coupon.type === "free_shipping") {
    return `สูงสุด ฿${coupon.discountAmount.toLocaleString("th-TH")}`;
  }

  return coupon.type === "percentage" ? "ส่วนลด" : "ลดทันที";
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
        <div className="mb-3 space-y-2">
          {appliedCoupons.map((coupon) => {
            const isFreeShipping = coupon.type === "free_shipping";
            const colorClass = isFreeShipping ? "emerald" : "brand";

            return (
              <div
                key={coupon.code}
                className={`relative overflow-hidden rounded-[1.35rem] border-2 bg-white shadow-[0_10px_24px_rgba(33,27,27,0.06)] ${
                  isFreeShipping ? "border-emerald-500" : "border-brand"
                }`}
              >
                <span className="absolute -left-3 top-1/2 z-10 h-7 w-7 -translate-y-1/2 rounded-full bg-white" />
                <div className="flex min-h-[116px]">
                  <div
                    className={`flex w-[6.75rem] shrink-0 flex-col items-center justify-center px-2 text-center text-white sm:w-32 ${
                      colorClass === "emerald" ? "bg-emerald-600" : "bg-brand"
                    }`}
                  >
                    <p className="text-[1.65rem] font-black leading-none tracking-normal sm:text-[2rem]">
                      {getCouponValueText(coupon)}
                    </p>
                    <p className="mt-2 text-[11px] font-extrabold leading-none sm:text-xs">
                      {getCouponValueHint(coupon)}
                    </p>
                  </div>

                  <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_3.75rem] items-center gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_4.5rem] sm:px-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black leading-tight text-ink sm:text-base">
                        {coupon.name || coupon.code}
                      </p>
                      <p className="mt-2 truncate text-[11px] font-black uppercase tracking-[0.12em] text-ink-soft sm:text-xs">
                        CODE: {coupon.code}
                      </p>
                      <p className="mt-2 line-clamp-1 text-[11px] font-semibold text-ink-soft sm:text-xs">
                        {getCouponDiscountText(coupon)}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRemove(coupon.code)}
                        aria-label={`แก้ไขโค้ด ${coupon.code}`}
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow-[0_0_0_6px_rgba(237,23,28,0.10),0_12px_24px_rgba(237,23,28,0.22)] transition active:scale-95 sm:h-14 sm:w-14 sm:text-xs ${
                          colorClass === "emerald"
                            ? "bg-emerald-600 shadow-[0_0_0_6px_rgba(16,185,129,0.14),0_12px_24px_rgba(5,150,105,0.22)]"
                            : "bg-brand"
                        }`}
                      >
                        แก้ไข
                      </button>
                      <MoreVertical className="h-4 w-4 text-ink" />
                    </div>
                  </div>
                </div>
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
