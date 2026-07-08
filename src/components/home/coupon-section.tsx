"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TicketPercent } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  claimCoupon,
  fetchAvailableCoupons,
  getCachedAvailableCoupons,
} from "@/features/coupons/coupon-api";
import { storePendingCouponCode } from "@/features/coupons/pending-coupon";
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
  remainingTotalUses?: number | null;
  maximumUsesPerCustomer?: number | null;
  customerUsedCount?: number | null;
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
    remainingTotalUses: null,
    maximumUsesPerCustomer: null,
    customerUsedCount: null,
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
    remainingTotalUses: null,
    maximumUsesPerCustomer: null,
    customerUsedCount: null,
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
    remainingTotalUses: asNumber(coupon.remainingTotalUses),
    maximumUsesPerCustomer: asNumber(
      coupon.maximumUsesPerCustomer ?? coupon.maxUsesPerCustomer
    ),
    customerUsedCount: asNumber(
      coupon.customerUsedCount ??
        coupon.customerUsageCount ??
        coupon.usedByCustomer ??
        coupon.usedCountByCustomer
    ),
  };
}

function canShowAvailableCoupon(coupon: HomeCoupon): boolean {
  if (coupon.remainingTotalUses === 0) return false;
  if (
    coupon.maximumUsesPerCustomer != null &&
    coupon.customerUsedCount != null &&
    coupon.customerUsedCount >= coupon.maximumUsesPerCustomer
  ) {
    return false;
  }

  return coupon.isClaimed || coupon.canClaim;
}

interface CouponSectionProps {
  coupons?: ApiCouponListItem[];
}

export function CouponSection({ coupons: apiCoupons = [] }: CouponSectionProps) {
  const router = useRouter();
  const [claimed, setClaimed] = useState<string[]>([]);
  const [remoteCoupons, setRemoteCoupons] =
    useState<ApiCouponListItem[]>(() =>
      apiCoupons.length > 0
        ? apiCoupons
        : getCachedAvailableCoupons({ salesChannel: "line_liff" })
    );
  const [couponsLoaded, setCouponsLoaded] = useState(
    () =>
      apiCoupons.length > 0 ||
      getCachedAvailableCoupons({ salesChannel: "line_liff" }).length > 0
  );
  const coupons = remoteCoupons
    .map(mapApiCoupon)
    .filter((coupon): coupon is HomeCoupon => Boolean(coupon));
  const visibleCoupons = coupons.filter(canShowAvailableCoupon);
  const visibleFallbackCoupons = fallbackCoupons.filter(
    (coupon) => !claimed.includes(coupon.id)
  );
  const displayCoupons = couponsLoaded
    ? visibleCoupons
    : visibleFallbackCoupons;

  useEffect(() => {
    let cancelled = false;
    const params = { salesChannel: "line_liff" };

    fetchAvailableCoupons(params)
      .then((items) => {
        if (!cancelled) {
          setRemoteCoupons(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteCoupons([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCouponsLoaded(true);
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

  const handleUseCoupon = (coupon: HomeCoupon) => {
    storePendingCouponCode(coupon.code);
    router.push(`/products?coupon=${encodeURIComponent(coupon.code)}`);
  };

  if (displayCoupons.length === 0) return null;

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="promo-section-title flex items-center gap-1.5">
          <TicketPercent className="h-5 w-5 text-brand" />
          คูปองสำหรับคุณ
        </h2>
        <Link
          href="/coupons"
          className="text-[11px] font-extrabold text-brand"
        >
          คูปองของฉัน
        </Link>
      </div>

      <div className="no-scrollbar -mx-3.5 flex gap-2.5 overflow-x-auto px-3.5 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0">
        {displayCoupons.map((coupon) => {
          const isClaimed = coupon.isClaimed || claimed.includes(coupon.id);
          const canClaim = coupon.canClaim && !isClaimed;
          return (
            <article
              key={coupon.id}
              className="home-panel-shadow relative flex min-w-[18rem] flex-1 overflow-hidden rounded-card bg-white ring-1 ring-brand/10 md:min-w-0"
            >
              <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-brand px-2 py-4 text-center text-white">
                <span className="text-xl font-extrabold leading-none">
                  {coupon.value}
                </span>
                <span className="mt-1 text-[10px] font-bold leading-tight text-white/80">
                  {coupon.minimumLabel}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-ink">
                    {coupon.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-ink-soft">
                    {coupon.detail}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-bold uppercase text-ink-soft">
                    CODE {coupon.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    isClaimed ? handleUseCoupon(coupon) : claim(coupon.id)
                  }
                  disabled={!isClaimed && !canClaim}
                  className={cn(
                    "flex h-9 shrink-0 items-center justify-center rounded-full px-3 text-xs font-bold transition",
                    isClaimed
                      ? "brand-button text-white"
                      : canClaim
                        ? "brand-button text-white"
                        : "bg-surface-muted text-ink-soft"
                  )}
                  aria-label={isClaimed ? "ใช้คูปอง" : "เก็บคูปอง"}
                >
                  {isClaimed ? "ใช้เลย" : "เก็บ"}
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
