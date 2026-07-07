"use client";

import { useEffect, useState } from "react";
import { Check, TicketPercent } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  claimCoupon,
  fetchAvailableCoupons,
} from "@/features/coupons/coupon-api";
import type { ApiCouponListItem } from "@/types/api";

interface HomeCoupon {
  id: string;
  value: string;
  title: string;
  detail: string;
  minimumLabel: string;
  code: string;
  isClaimed: boolean;
  canClaim: boolean;
  isFallback?: boolean;
}

const fallbackCoupons: HomeCoupon[] = [
  {
    id: "welcome50",
    value: "฿50",
    title: "ส่วนลด 50 ฿",
    detail: "เฉพาะร้านที่ไม่เคยลอง",
    minimumLabel: "ขั้นต่ำ 499 ฿",
    code: "PONPON50",
    isClaimed: false,
    canClaim: true,
    isFallback: true,
  },
  {
    id: "shipping",
    value: "FREE",
    title: "ส่งฟรี",
    detail: "เมื่อช้อปครบ ฿399",
    minimumLabel: "ขั้นต่ำ 399 ฿",
    code: "FREESHIP",
    isClaimed: false,
    canClaim: true,
    isFallback: true,
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

function getMinimumAmount(coupon: ApiCouponListItem): number | null {
  return (
    asNumber(coupon.minimumSpend) ??
    asNumber(coupon.minimumSubtotal) ??
    asNumber(coupon.minimumOrderAmount) ??
    asNumber(coupon.minOrderAmount)
  );
}

function getMinimumSpendText(coupon: ApiCouponListItem): string {
  const amount = getMinimumAmount(coupon);
  return amount && amount > 0
    ? `เมื่อช้อปครบ ฿${amount.toLocaleString("th-TH")}`
    : "ใช้ได้ตอนชำระเงิน";
}

function getMinimumLabel(coupon: ApiCouponListItem): string {
  const amount = getMinimumAmount(coupon);
  return amount && amount > 0
    ? `ขั้นต่ำ ${amount.toLocaleString("th-TH")} ฿`
    : "ไม่มีขั้นต่ำ";
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
    minimumLabel: getMinimumLabel(coupon),
    code: coupon.code,
    isClaimed: coupon.isClaimed === true,
    canClaim: coupon.canClaim !== false,
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

    fetchAvailableCoupons({
      salesChannel: "line_liff",
    }).then((items) => {
      if (!cancelled && items.length > 0) {
        setRemoteCoupons(items);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const claim = (id: string) => {
    const coupon = displayCoupons.find((item) => item.id === id);
    if (!coupon || coupon.isClaimed || !coupon.canClaim) return;

    if (!coupon.isFallback) {
      claimCoupon(id).then((claimedCoupon) => {
        if (!claimedCoupon) return;
        setRemoteCoupons((current) =>
          current.map((item) => (item.id === id ? claimedCoupon : item))
        );
      });
      return;
    }

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
          const isClaimed = coupon.isClaimed || claimed.includes(coupon.id);
          const canClaim = coupon.canClaim && !isClaimed;
          return (
            <article
              key={coupon.id}
              className="home-panel-shadow relative flex min-h-[10.25rem] min-w-[20.5rem] flex-1 overflow-hidden rounded-[1.4rem] bg-[#ffe6ec] p-2 md:min-w-0"
            >
              <span className="absolute -left-3 top-1/2 z-20 h-8 w-8 -translate-y-1/2 rounded-full bg-surface-muted" />
              <div className="relative flex w-full overflow-hidden rounded-[1.15rem] bg-white">
                <div className="flex w-[8.5rem] shrink-0 flex-col items-center justify-center bg-brand px-3 py-4 text-center text-white">
                  <span className="text-[2.15rem] font-black leading-none">
                    {coupon.value}
                  </span>
                  <span className="mt-3 text-sm font-extrabold leading-tight text-white">
                    {coupon.minimumLabel}
                  </span>
                </div>
                <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_4.25rem] items-center gap-3 px-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-ink">
                      {coupon.title}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm font-extrabold leading-snug text-ink-soft">
                      {coupon.detail}
                    </p>
                    <p className="mt-3 truncate text-sm font-black uppercase text-ink-soft">
                      CODE {coupon.code}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => claim(coupon.id)}
                    disabled={!canClaim}
                    className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition active:scale-95 disabled:shadow-none",
                      isClaimed
                        ? "bg-emerald-100 text-emerald-600 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]"
                        : canClaim
                          ? "bg-brand text-white shadow-[0_0_0_6px_rgba(247,18,35,0.12),0_12px_24px_rgba(247,18,35,0.24)]"
                          : "bg-surface-muted text-ink-soft"
                    )}
                    aria-label={isClaimed ? "เก็บคูปองแล้ว" : "เก็บคูปอง"}
                  >
                    {isClaimed ? <Check className="h-5 w-5" /> : "เก็บ"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
