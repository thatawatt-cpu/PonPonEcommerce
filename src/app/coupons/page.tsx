"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock3,
  Copy,
  ShoppingBag,
  Sparkles,
  TicketPercent,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { fetchMyCoupons } from "@/features/coupons/coupon-api";
import { cn } from "@/lib/utils";
import type { ApiCouponListItem } from "@/types/api";

type CouponStatus = "available" | "used" | "expired";
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
}

const fallbackCoupons: CouponItem[] = [
  {
    id: "welcome50",
    title: "คูปองส่วนลด ฿50",
    description: "ใช้ได้กับสินค้าทุกหมวด เมื่อยอดครบตามเงื่อนไข",
    code: "PONPON50",
    value: "฿50",
    minimumSpend: "ซื้อครบ ฿499",
    minimumLabel: "ขั้นต่ำ 499 ฿",
    expireAt: "หมดอายุ 15 มิ.ย. 2569",
    status: "available",
    kind: "discount",
    icon: TicketPercent,
  },
  {
    id: "freeship",
    title: "ส่งฟรีเมื่อซื้อครบ",
    description: "ลดค่าจัดส่งสำหรับออเดอร์ที่เข้าเงื่อนไข",
    code: "FREESHIP",
    value: "FREE",
    minimumSpend: "ซื้อครบ ฿399",
    minimumLabel: "ขั้นต่ำ 399 ฿",
    expireAt: "หมดอายุ 18 มิ.ย. 2569",
    status: "available",
    kind: "shipping",
    icon: Truck,
  },
  {
    id: "ref-friend",
    title: "คูปองเพื่อนใหม่ ลด ฿50",
    description: "รับจากการใช้รหัสแนะนำเพื่อน ใช้ได้เมื่อยอดสินค้าครบ ฿299",
    code: "PONFRIEND50",
    value: "฿50",
    minimumSpend: "ซื้อครบ ฿299",
    minimumLabel: "ขั้นต่ำ 299 ฿",
    expireAt: "หมดอายุ 30 วันหลังรับคูปอง",
    status: "available",
    kind: "discount",
    icon: TicketPercent,
  },
  {
    id: "ref-inviter",
    title: "รางวัลแนะนำเพื่อน ลด ฿50",
    description: "รับเมื่อเพื่อนที่แนะนำสั่งซื้อสำเร็จ",
    code: "PONTHANK50",
    value: "฿50",
    minimumSpend: "ซื้อครบ ฿299",
    minimumLabel: "ขั้นต่ำ 299 ฿",
    expireAt: "หมดอายุ 30 วันหลังได้รับรางวัล",
    status: "available",
    kind: "gift",
    icon: Sparkles,
  },
  {
    id: "cookie20",
    title: "คุกกี้ลดทันที ฿20",
    description: "ใช้ได้เฉพาะคุกกี้เนยสดป๋องป๋อง",
    code: "COOKIE20",
    value: "฿20",
    minimumSpend: "เฉพาะคุกกี้",
    minimumLabel: "เฉพาะคุกกี้",
    expireAt: "หมดอายุ 20 มิ.ย. 2569",
    status: "available",
    kind: "discount",
    icon: TicketPercent,
  },
  {
    id: "milktea10",
    title: "ชานมลดทันที ฿10",
    description: "ใช้ได้เฉพาะชานมไข่มุกป๋องป๋อง",
    code: "MILKTEA10",
    value: "฿10",
    minimumSpend: "เฉพาะชานม",
    minimumLabel: "เฉพาะชานม",
    expireAt: "หมดอายุ 20 มิ.ย. 2569",
    status: "available",
    kind: "discount",
    icon: TicketPercent,
  },
  {
    id: "lip15",
    title: "ลิปทินต์ลดทันที ฿15",
    description: "ใช้ได้เฉพาะลิปทินต์ป๋องป๋อง",
    code: "LIP15",
    value: "฿15",
    minimumSpend: "เฉพาะลิปทินต์",
    minimumLabel: "เฉพาะลิปทินต์",
    expireAt: "หมดอายุ 22 มิ.ย. 2569",
    status: "available",
    kind: "discount",
    icon: TicketPercent,
  },
  {
    id: "bundle20",
    title: "ซื้อคู่แล้วคุ้ม",
    description: "ลด ฿20 เมื่อมีคุกกี้และชานมในออเดอร์เดียวกัน",
    code: "BUNDLE20",
    value: "฿20",
    minimumSpend: "คุกกี้ + ชานม",
    minimumLabel: "คุกกี้ + ชานม",
    expireAt: "หมดอายุ 20 มิ.ย. 2569",
    status: "available",
    kind: "gift",
    icon: Sparkles,
  },
  {
    id: "old10",
    title: "ลูกค้าประจำลด 10%",
    description: "ใช้กับออเดอร์ล่าสุดเรียบร้อยแล้ว",
    code: "LOYAL10",
    value: "10%",
    minimumSpend: "ใช้แล้ว",
    minimumLabel: "ใช้แล้ว",
    expireAt: "ใช้เมื่อ 8 มิ.ย. 2569",
    status: "used",
    kind: "discount",
    icon: TicketPercent,
  },
  {
    id: "expiredgift",
    title: "ของฝากสุดคุ้ม",
    description: "คูปองนี้หมดอายุแล้ว รอรับดีลใหม่เร็ว ๆ นี้",
    code: "GIFT30",
    value: "฿30",
    minimumSpend: "ซื้อครบ ฿299",
    minimumLabel: "ขั้นต่ำ 299 ฿",
    expireAt: "หมดอายุ 1 มิ.ย. 2569",
    status: "expired",
    kind: "gift",
    icon: ShoppingBag,
  },
];

const filters: { value: CouponFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "available", label: "พร้อมใช้" },
  { value: "used", label: "ใช้แล้ว" },
  { value: "expired", label: "หมดอายุ" },
];

const statusLabel: Record<CouponStatus, string> = {
  available: "พร้อมใช้",
  used: "ใช้แล้ว",
  expired: "หมดอายุ",
};

const statusClass: Record<CouponStatus, string> = {
  available: "bg-success-soft text-success",
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

  const date = new Date(value);
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
  const status: CouponStatus =
    endsAt && new Date(endsAt).getTime() < Date.now()
      ? "expired"
      : "available";

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
  };
}

export default function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  use(searchParams);
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<CouponFilter>("available");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [remoteCoupons, setRemoteCoupons] = useState<ApiCouponListItem[]>([]);
  const coupons = useMemo(() => {
    const apiCoupons = remoteCoupons
      .map(mapApiCoupon)
      .filter((coupon): coupon is CouponItem => Boolean(coupon));
    return apiCoupons.length > 0 ? apiCoupons : fallbackCoupons;
  }, [remoteCoupons]);

  useEffect(() => {
    let cancelled = false;
    fetchMyCoupons().then((items) => {
      if (!cancelled && items.length > 0) {
        setRemoteCoupons(items);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCoupons = useMemo(() => {
    if (activeFilter === "all") return coupons;
    return coupons.filter((coupon) => coupon.status === activeFilter);
  }, [activeFilter, coupons]);

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

  const applyCouponNow = (code: string) => {
    router.push(`/checkout?promo=${encodeURIComponent(code)}`);
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

        <div className="space-y-3">
          {filteredCoupons.map((coupon) => {
            const isAvailable = coupon.status === "available";
            const isCopied = copiedCode === coupon.code;

            return (
              <Card
                key={coupon.id}
                className={cn(
                  "relative overflow-hidden bg-[#ffe6ec] p-2",
                  !isAvailable && "opacity-75",
                )}
              >
                <span className="absolute -left-3 top-1/2 z-20 h-8 w-8 -translate-y-1/2 rounded-full bg-surface-muted" />
                <div className="relative flex min-h-[10.25rem] overflow-hidden rounded-[1.15rem] bg-white">
                  <div
                    className={cn(
                      "flex w-[8.5rem] shrink-0 flex-col items-center justify-center px-3 py-4 text-center text-white",
                      isAvailable ? "bg-brand" : "bg-ink-soft",
                    )}
                  >
                    <span className="text-[2.15rem] font-black leading-none">
                      {coupon.value}
                    </span>
                    <span className="mt-3 text-sm font-extrabold leading-tight text-white">
                      {coupon.minimumLabel}
                    </span>
                  </div>

                  <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black text-ink">
                            {coupon.title}
                          </h2>
                          <p className="mt-2 line-clamp-2 text-sm font-extrabold leading-snug text-ink-soft">
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
                      <p className="mt-3 truncate text-sm font-black uppercase text-ink-soft">
                        CODE {coupon.code}
                      </p>
                      <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-ink-soft">
                        <Clock3 className="h-3.5 w-3.5" />
                        {coupon.expireAt}
                      </p>
                    </div>
                    {isAvailable ? (
                      <div className="flex shrink-0 flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyCode(coupon.code)}
                          aria-label={`คัดลอกโค้ด ${coupon.code}`}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full transition",
                            isCopied
                              ? "bg-success-soft text-success"
                              : "bg-white text-brand shadow-sm ring-1 ring-brand/10",
                          )}
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => applyCouponNow(coupon.code)}
                          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white shadow-[0_0_0_6px_rgba(247,18,35,0.12),0_12px_24px_rgba(247,18,35,0.24)] transition active:scale-95"
                        >
                          ใช้เลย
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredCoupons.length === 0 ? (
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
