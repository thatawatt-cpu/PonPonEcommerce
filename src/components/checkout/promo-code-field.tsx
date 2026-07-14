"use client";

import Link from "next/link";
import { ChevronRight, Loader2, X } from "lucide-react";

interface AppliedCouponDisplay {
  code: string;
  name: string;
  type: string;
  discountAmount: number;
}

interface CouponAvailabilityDisplay {
  canUse: boolean;
  unavailableReason?: string | null;
}

interface PromoCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: (code: string) => void;
  checkoutMode?: "buy-now" | "cart-selection";
  selectedCouponCodes?: string[];
  appliedCoupons?: AppliedCouponDisplay[];
  couponAvailabilityByCode?: Record<string, CouponAvailabilityDisplay>;
  couponCodeCount?: number;
  message?: string;
  error?: boolean;
  applying?: boolean;
}

export function PromoCodeField({
  value,
  onChange,
  onApply,
  onRemove,
  checkoutMode,
  selectedCouponCodes,
  appliedCoupons = [],
  couponAvailabilityByCode = {},
  couponCodeCount = selectedCouponCodes?.length ?? appliedCoupons.length,
  message,
  error,
  applying = false,
}: PromoCodeFieldProps) {
  const selectedCodes =
    selectedCouponCodes ?? appliedCoupons.map((coupon) => coupon.code);
  const appliedCouponByCode = new Map(
    appliedCoupons.map((coupon) => [coupon.code, coupon])
  );
  const couponPickerParams = new URLSearchParams({ returnTo: "checkout" });
  if (checkoutMode) couponPickerParams.set("mode", checkoutMode);
  if (selectedCodes.length > 0) {
    couponPickerParams.set("selected", selectedCodes.join(","));
  }
  const couponPickerHref = `/coupons?${couponPickerParams.toString()}`;
  const normalizedValue = value.trim().toUpperCase();
  const typedAvailability = normalizedValue
    ? couponAvailabilityByCode[normalizedValue]
    : undefined;
  const typedUnavailable =
    typedAvailability != null && typedAvailability.canUse === false;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-ink-soft">
          กรอกโค้ด หรือเลือกจากคูปองที่มี
        </p>
        <Link
          href={couponPickerHref}
          className="flex shrink-0 items-center gap-0.5 text-xs font-extrabold text-brand"
        >
          เลือกคูปอง
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {selectedCodes.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {selectedCodes.map((code) => {
            const coupon = appliedCouponByCode.get(code);
            const availability = couponAvailabilityByCode[code];
            const isFreeShipping = coupon?.type === "free_shipping";
            const isApplied = Boolean(coupon);
            const isUnavailable = availability?.canUse === false;
            const toneClass = !isApplied
              ? isUnavailable
                ? "border-warning/20 bg-warning-soft text-warning"
                : "border-black/10 bg-[#f7f4f1] text-ink-soft"
              : isFreeShipping
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-brand/15 bg-brand-soft text-brand";

            return (
              <div
                key={code}
                className={`flex min-h-11 items-center gap-2 rounded-2xl border px-3 py-2 shadow-sm ${toneClass}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    {!isApplied && !isUnavailable ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                    ) : null}
                    <p className="truncate text-sm font-extrabold leading-tight">
                      {coupon?.name || code}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[10px] font-bold opacity-70">
                    {isApplied
                      ? "ใช้คูปองแล้ว"
                      : isUnavailable
                        ? availability?.unavailableReason ?? "คูปองนี้ใช้ไม่ได้"
                        : "กำลังตรวจสอบคูปอง"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(code)}
                  aria-label={`ลบคูปอง ${coupon?.name || code}`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white transition active:scale-95 ${
                    !isApplied
                      ? "text-ink-soft"
                      : isFreeShipping
                        ? "text-emerald-700"
                        : "text-brand"
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {couponCodeCount < 2 && (
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
            disabled={!value.trim() || applying || typedUnavailable}
            className="brand-button h-11 shrink-0 rounded-full px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            ใช้โค้ด
          </button>
        </div>
      )}

      {typedUnavailable && typedAvailability?.unavailableReason ? (
        <p className="mt-2 text-xs font-bold text-warning">
          {typedAvailability.unavailableReason}
        </p>
      ) : null}

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
