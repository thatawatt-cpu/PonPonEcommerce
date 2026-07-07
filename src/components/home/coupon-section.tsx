"use client";

import { useEffect, useState } from "react";
import { Check, TicketPercent } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchCoupons } from "@/features/coupons/coupon-api";
import type { ApiCouponListItem } from "@/types/api";

interface HomeCoupon {
  id: string;
  value: string;
  title: string;
  detail: string;
  code: string;
}

const fallbackCoupons: HomeCoupon[] = [
  {
    id: "welcome50",
    value: "฿50",
    title: "ลดทันที",
    detail: "เมื่อช้อปครบ ฿499",
    code: "PONPON50",
  },
  {
    id: "shipping",
    value: "FREE",
    title: "ส่งฟรี",
    detail: "เมื่อช้อปครบ ฿399",
    code: "FREESHIP",
  },
];

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getCouponType(coupon: ApiCouponListItem): string {
  return (coupon.type || coupon.discountType || "").trim().toLowerCase();
}

function getCouponValue(coupon: ApiCouponListItem): string {
  const type = getCouponType(coupon);
  if (type === "free_shipping") return "FREE";

  const amount =
    asNumber(coupon.discountAmount) ??
    asNumber(coupon.discountValue) ??
    asNumber(coupon.value);

  if (amount == null) return typeof coupon.value === "string" ? coupon.value : "คูปอง";
  if (type === "percentage") return `${amount}%`;
  return `฿${amount.toLocaleString("th-TH")}`;
}

function getMinimumSpendText(coupon: ApiCouponListItem): string {
  const amount =
    asNumber(coupon.minimumSpend) ??
    asNumber(coupon.minimumOrderAmount) ??
    asNumber(coupon.minOrderAmount);

  return amount && amount > 0
    ? `เมื่อช้อปครบ ฿${amount.toLocaleString("th-TH")}`
    : "ใช้ได้ตอนชำระเงิน";
}

function mapApiCoupon(coupon: ApiCouponListItem): HomeCoupon | null {
  if (!coupon.code) return null;

  const type = getCouponType(coupon);
  const title =
    coupon.name ||
    coupon.title ||
    (type === "free_shipping" ? "ส่งฟรี" : "ลดทันที");

  return {
    id: coupon.id || coupon.code,
    value: getCouponValue(coupon),
    title,
    detail: coupon.description || getMinimumSpendText(coupon),
    code: coupon.code,
  };
}

interface CouponSectionProps {
  coupons?: ApiCouponListItem[];
}

export function CouponSection({ coupons: apiCoupons = [] }: CouponSectionProps) {
  const [claimed, setClaimed] = useState<string[]>([]);
  const [remoteCoupons, setRemoteCoupons] =
    useState<ApiCouponListItem[]>(apiCoupons);
  const coupons = remoteCoupons
    .map(mapApiCoupon)
    .filter((coupon): coupon is HomeCoupon => Boolean(coupon));
  const displayCoupons = coupons.length > 0 ? coupons : fallbackCoupons;

  useEffect(() => {
    let cancelled = false;

    fetchCoupons().then((items) => {
      if (!cancelled && items.length > 0) {
        setRemoteCoupons(items);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const claim = (id: string) => {
    setClaimed((current) =>
      current.includes(id) ? current : [...current, id]
    );
  };

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="promo-section-title flex items-center gap-1.5">
          <TicketPercent className="h-5 w-5 text-brand" />
          คูปองสำหรับคุณ
        </h2>
        <span className="text-[11px] font-semibold text-ink-soft">
          เก็บไว้ใช้ตอนชำระเงิน
        </span>
      </div>

      <div className="no-scrollbar -mx-3.5 flex gap-2.5 overflow-x-auto px-3.5 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0">
        {displayCoupons.map((coupon) => {
          const isClaimed = claimed.includes(coupon.id);
          return (
            <article
              key={coupon.id}
              className="home-panel-shadow relative flex min-w-[18rem] flex-1 overflow-hidden rounded-card bg-white ring-1 ring-brand/10 md:min-w-0"
            >
              <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-brand px-2 py-4 text-center text-white">
                <span className="text-xl font-extrabold leading-none">
                  {coupon.value}
                </span>
                <span className="mt-1 text-[10px] font-bold text-white/80">
                  {coupon.title}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-ink">
                    {coupon.detail}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-ink-soft">
                    CODE: {coupon.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => claim(coupon.id)}
                  disabled={isClaimed}
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full text-xs font-bold transition",
                    isClaimed
                      ? "h-9 w-9 bg-[#d9fbe7] text-[#12a85a]"
                      : "brand-button h-9 px-3 text-white"
                  )}
                  aria-label={isClaimed ? "เก็บคูปองแล้ว" : "เก็บคูปอง"}
                >
                  {isClaimed ? <Check className="h-4 w-4" /> : "เก็บ"}
                </button>
              </div>
              <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface-muted" />
            </article>
          );
        })}
      </div>
    </section>
  );
}
