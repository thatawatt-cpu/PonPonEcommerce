"use client";

import dynamic from "next/dynamic";
import { TicketPercent } from "lucide-react";
import type { ApiCouponListItem } from "@/types/api";

function CouponSectionSkeleton() {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="promo-section-title flex items-center gap-1.5">
          <TicketPercent className="h-5 w-5 text-brand" />
          คูปองสำหรับคุณ
        </h2>
        <div className="h-4 w-20 animate-pulse rounded-full bg-surface-muted" />
      </div>
      <div className="no-scrollbar -mx-3.5 flex gap-2.5 overflow-x-auto px-3.5 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="home-panel-shadow relative flex min-w-[18rem] flex-1 overflow-hidden rounded-card bg-white ring-1 ring-brand/10 md:min-w-0"
          >
            <div className="h-[5.75rem] w-24 shrink-0 animate-pulse bg-brand/15" />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-28 animate-pulse rounded-full bg-surface-muted" />
                <div className="h-3 w-36 animate-pulse rounded-full bg-surface-muted" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-surface-muted" />
              </div>
              <div className="h-9 w-14 shrink-0 animate-pulse rounded-full bg-surface-muted" />
            </div>
            <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--background)]" />
          </div>
        ))}
      </div>
    </section>
  );
}

const CouponSection = dynamic(
  () => import("@/components/home/coupon-section").then((m) => ({ default: m.CouponSection })),
  { ssr: false, loading: () => <CouponSectionSkeleton /> }
);

interface CouponSectionLazyProps {
  coupons?: ApiCouponListItem[];
}

export function CouponSectionLazy({ coupons }: CouponSectionLazyProps) {
  return <CouponSection coupons={coupons} />;
}
