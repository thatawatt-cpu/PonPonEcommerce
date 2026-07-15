"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock3,
  Copy,
  Loader2,
  Sparkles,
  TicketPercent,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { fetchMyCoupons } from "@/features/coupons/coupon-api";
import { storePendingCouponCode } from "@/features/coupons/pending-coupon";
import { getStoredBuyNowCheckout } from "@/features/checkout/buy-now-checkout";
import { getStoredCartSelectionCheckout } from "@/features/checkout/cart-selection-checkout";
import { parseApiDate, parseApiTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import type { ApiCouponListItem } from "@/types/api";

type CouponStatus = "available" | "used" | "expired" | "unavailable";
type CouponKind = "discount" | "shipping" | "gift";
type CouponFilter = "all" | CouponStatus;

interface CouponItem {
  id: string;
  title: string;
  description: string;
  code: string;
  value: string;
  minimumSpend: string;
  minimumLabel: string;
  expireAt: string;
  status: CouponStatus;
  kind: CouponKind;
  icon: LucideIcon;
  canUse: boolean;
  unavailableReason: string | null;
}

const filters: { value: CouponFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "available", label: "พร้อมใช้" },
  { value: "unavailable", label: "ใช้ไม่ได้" },
  { value: "used", label: "ใช้แล้ว" },
  { value: "expired", label: "หมดอายุ" },
];

const statusLabel: Record<CouponStatus, string> = {
  available: "พร้อมใช้",
  unavailable: "ใช้ไม่ได้",
  used: "ใช้แล้ว",
  expired: "หมดอายุ",
};

const statusClass: Record<CouponStatus, string> = {
  available: "bg-success-soft text-success",
  unavailable: "bg-warning-soft text-warning",
  used: "bg-surface-muted text-ink-soft",
  expired: "bg-black/[0.06] text-ink-soft",
};

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

function getCouponIcon(kind: CouponKind): LucideIcon {
  if (kind === "shipping") return Truck;
  if (kind === "gift") return Sparkles;
  return TicketPercent;
}

function getCouponValue(coupon: ApiCouponListItem): string {
  const type = getCouponType(coupon);
  if (type === "free_shipping") return "FREE";

  const amount =
    asNumber(coupon.discountAmount) ??
    asNumber(coupon.discountValue) ??
    asNumber(coupon.value);

  if (amount == null) {
    return typeof coupon.value === "string" ? coupon.value : "คูปอง";
  }
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
    ? `ซื้อครบ ฿${amount.toLocaleString("th-TH")}`
    : "ใช้ได้ตอนชำระเงิน";
}

function getMinimumLabel(coupon: ApiCouponListItem): string {
  const amount = getMinimumAmount(coupon);
  return amount && amount > 0
    ? `ขั้นต่ำ ${amount.toLocaleString("th-TH")} ฿`
    : "ไม่มีขั้นต่ำ";
}

function getExpireText(coupon: ApiCouponListItem): string {
  const value = coupon.endsAtUtc || coupon.expiresAt || coupon.endAt;
  if (!value) return "ตรวจสอบวันหมดอายุตอนใช้คูปอง";

  const date = parseApiDate(value, { utc: Boolean(coupon.endsAtUtc) });
  if (Number.isNaN(date.getTime())) return value;
  return `หมดอายุ ${date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function mapApiCoupon(coupon: ApiCouponListItem): CouponItem | null {
  if (!coupon.code) return null;

  const type = getCouponType(coupon);
  const kind: CouponKind =
    type === "free_shipping"
      ? "shipping"
      : coupon.scopeLabels?.length
        ? "gift"
        : "discount";
  const endsAt = coupon.endsAtUtc || coupon.expiresAt || coupon.endAt;
  const isExpired =
    coupon.isExpired === true ||
    Boolean(
      endsAt &&
        parseApiTime(endsAt, { utc: Boolean(coupon.endsAtUtc) }) < Date.now()
    );
  const canUse = coupon.canUse !== false && !isExpired;
  const status: CouponStatus =
    isExpired
      ? "expired"
      : canUse
        ? "available"
        : "unavailable";

  return {
    id: coupon.id || coupon.code,
    title:
      coupon.name ||
      coupon.title ||
      (type === "free_shipping" ? "คูปองส่งฟรี" : "คูปองส่วนลด"),
    description:
      coupon.description ||
      coupon.conditionLabels?.join(" · ") ||
      getMinimumSpendText(coupon),
    code: coupon.code,
    value: getCouponValue(coupon),
    minimumSpend: getMinimumSpendText(coupon),
    minimumLabel: getMinimumLabel(coupon),
    expireAt: getExpireText(coupon),
    status,
    kind,
    icon: getCouponIcon(kind),
    canUse,
    unavailableReason: coupon.unavailableReason ?? null,
  };
}

export default function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnTo?: string;
    selected?: string;
    mode?: string;
  }>;
}) {
  const { returnTo, selected, mode } = use(searchParams);
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<CouponFilter>("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [remoteCoupons, setRemoteCoupons] = useState<ApiCouponListItem[]>([]);
  const [couponsLoaded, setCouponsLoaded] = useState(false);
  const coupons = useMemo(() => {
    return remoteCoupons
      .map(mapApiCoupon)
      .filter((coupon): coupon is CouponItem => Boolean(coupon));
  }, [remoteCoupons]);

  useEffect(() => {
    let cancelled = false;
    fetchMyCoupons()
      .then((items) => {
        if (cancelled) return;
        setRemoteCoupons(items);
      })
      .finally(() => {
        if (!cancelled) setCouponsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCoupons = useMemo(() => {
    if (activeFilter === "all") return coupons;
    return coupons.filter((coupon) => coupon.status === activeFilter);
  }, [activeFilter, coupons]);
  const availableCoupons = useMemo(
    () =>
      coupons.filter((coupon) => coupon.status === "available" && coupon.canUse),
    [coupons],
  );
  const unavailableCoupons = useMemo(
    () =>
      coupons.filter(
        (coupon) => coupon.status !== "available" || !coupon.canUse,
      ),
    [coupons],
  );
  const couponSections = useMemo(() => {
    if (activeFilter !== "all") {
      return [
        {
          title: null,
          description: null,
          coupons: filteredCoupons,
        },
      ];
    }

    return [
      {
        title: "คูปองพร้อมใช้",
        description: "เลือกคูปองที่เข้าเงื่อนไขเพื่อใช้กับคำสั่งซื้อ",
        coupons: availableCoupons,
      },
      {
        title: "คูปองที่ยังใช้ไม่ได้",
        description: "ตรวจสอบเงื่อนไขคูปองเพื่อใช้งาน",
        coupons: unavailableCoupons,
      },
    ].filter((section) => section.coupons.length > 0);
  }, [activeFilter, availableCoupons, filteredCoupons, unavailableCoupons]);

  const availableCount = coupons.filter(
    (coupon) => coupon.status === "available",
  ).length;

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1600);
    } catch {
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1600);
    }
  };

  const applyCouponNow = (coupon: CouponItem) => {
    if (!coupon.canUse) return;

    const code = coupon.code;
    setApplyingCode(code);

    if (returnTo !== "checkout") {
      storePendingCouponCode(code);
      router.push(`/products?coupon=${encodeURIComponent(code)}`);
      return;
    }

    const selectedCodes =
      selected
        ?.split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean) ?? [];
    const couponCodes = [
      ...new Set([...selectedCodes, code.trim().toUpperCase()]),
    ].slice(0, 2);
    const params = new URLSearchParams({
      coupons: couponCodes.join(","),
    });

    if (mode === "buy-now" || mode === "cart-selection") {
      params.set("mode", mode);
    } else if (getStoredBuyNowCheckout()) {
      params.set("mode", "buy-now");
    } else if (getStoredCartSelectionCheckout().length > 0) {
      params.set("mode", "cart-selection");
    }

    router.push(`/checkout?${params.toString()}#checkout-coupon-section`);
  };

  return (
    <>
      <AppHeader
        title="คูปองของฉัน"
        showBack
        showCart={false}
        showNotifications={false}
      />
      <PageContainer className="space-y-4 pt-4">
        <section className="overflow-hidden rounded-card bg-brand p-4 text-white shadow-[0_14px_32px_rgba(190,9,14,0.24)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white/80">My Coupons</p>
              <h1 className="mt-1 text-2xl font-extrabold">
                มีคูปองพร้อมใช้ {availableCount} ใบ
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-white/80">
                เก็บคูปองไว้ใช้ตอนชำระเงิน ระบบจะเลือกส่วนลดที่เหมาะที่สุดให้
              </p>
            </div>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white/18 text-white shadow-inner">
              <TicketPercent className="h-7 w-7" />
            </span>
          </div>
        </section>

        <Card className="p-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition",
                  activeFilter === filter.value
                    ? "bg-brand text-white"
                    : "bg-surface-muted text-ink-soft",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </Card>

        {!couponsLoaded ? (
          <Card className="px-4 py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
            <p className="mt-3 text-sm font-extrabold text-ink">
              กำลังโหลดคูปอง
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              ระบบกำลังดึงคูปองของคุณจากร้าน
            </p>
          </Card>
        ) : null}

        {couponsLoaded ? (
          <div className="space-y-5">
            {couponSections.map((section) => (
              <section
                key={section.title ?? activeFilter}
                className="space-y-2.5"
              >
                {section.title ? (
                  <div>
                    <h2 className="text-base font-extrabold text-ink">
                      {section.title}
                    </h2>
                    <p className="text-xs font-semibold text-ink-soft">
                      {section.description}
                    </p>
                  </div>
                ) : null}
                <div className="space-y-3">
          {section.coupons.map((coupon) => {
            const Icon = coupon.icon;
            const isAvailable = coupon.status === "available" && coupon.canUse;
            const isCopied = copiedCode === coupon.code;
            const isApplying = applyingCode === coupon.code;
            const isShippingCoupon = coupon.kind === "shipping";
            const unavailableText =
              !isAvailable ? coupon.unavailableReason ?? coupon.description : null;

            return (
              <Card
                key={coupon.id}
                className={cn(
                  "relative overflow-hidden",
                  !isAvailable && "opacity-85",
                )}
              >
                <div className="flex">
                  <div
                    className={cn(
                      "flex w-24 shrink-0 flex-col items-center justify-center px-3 py-5 text-center text-white",
                      isAvailable
                        ? isShippingCoupon
                          ? "bg-success"
                          : "bg-brand"
                        : "bg-ink-soft",
                    )}
                  >
                    <Icon className="mb-2 h-5 w-5" />
                    <span className="text-xl font-extrabold leading-none">
                      {coupon.value}
                    </span>
                    <span className="mt-1 text-[10px] font-bold leading-tight text-white/80">
                      {coupon.minimumLabel}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 px-3 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-extrabold text-ink">
                          {coupon.title}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                          {coupon.description}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold",
                          statusClass[coupon.status],
                        )}
                      >
                        {statusLabel[coupon.status]}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "mt-3 flex items-center justify-between gap-2 rounded-2xl px-3 py-2",
                        isAvailable && isShippingCoupon
                          ? "bg-success-soft/70"
                          : "bg-[#fff8f6]",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-ink-soft">
                          CODE
                        </p>
                        <p className="truncate text-xs font-extrabold uppercase text-ink">
                          {coupon.code}
                        </p>
                      </div>
                      {isAvailable ? (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyCode(coupon.code)}
                            aria-label={`คัดลอกโค้ด ${coupon.code}`}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full transition",
                              isCopied
                                ? "bg-success-soft text-success"
                                : isShippingCoupon
                                  ? "bg-white text-success shadow-sm ring-1 ring-success/15"
                                  : "bg-white text-brand shadow-sm ring-1 ring-brand/10",
                            )}
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => applyCouponNow(coupon)}
                            disabled={Boolean(applyingCode)}
                            className={cn(
                              "flex h-8 items-center rounded-full px-3 text-xs font-extrabold text-white disabled:opacity-70",
                              isShippingCoupon
                                ? "success-button"
                                : "brand-button",
                            )}
                          >
                            {isApplying ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "ใช้เลย"
                            )}
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {unavailableText ? (
                      <div className="mt-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold leading-relaxed text-red-600">
                        {unavailableText}
                      </div>
                    ) : (
                      <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-ink-soft">
                        <Clock3 className="h-3.5 w-3.5" />
                        {coupon.expireAt}
                      </p>
                    )}
                  </div>
                </div>
                <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface-muted" />
              </Card>
            );
          })}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {couponsLoaded && couponSections.length === 0 ? (
          <Card className="px-4 py-10 text-center">
            <TicketPercent className="mx-auto h-8 w-8 text-ink-soft/40" />
            <p className="mt-3 text-sm font-extrabold text-ink">
              ยังไม่มีคูปองในหมวดนี้
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              กลับไปเลือกหมวดอื่น หรือรอดีลใหม่จากร้าน PonPon
            </p>
          </Card>
        ) : null}

        <Link
          href="/products"
          className="brand-button flex h-12 items-center justify-center rounded-full text-sm font-extrabold text-white"
        >
          ไปเลือกสินค้าเพื่อใช้คูปอง
        </Link>
      </PageContainer>
    </>
  );
}
