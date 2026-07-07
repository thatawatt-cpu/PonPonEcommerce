"use client";

import dynamic from "next/dynamic";
import type { ApiCouponListItem } from "@/types/api";

const CouponSection = dynamic(
  () => import("@/components/home/coupon-section").then((m) => ({ default: m.CouponSection })),
  { ssr: false }
);

interface CouponSectionLazyProps {
  coupons?: ApiCouponListItem[];
}

export function CouponSectionLazy({ coupons }: CouponSectionLazyProps) {
  return <CouponSection coupons={coupons} />;
}
