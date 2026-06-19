"use client";

import dynamic from "next/dynamic";

const CouponSection = dynamic(
  () => import("@/components/home/coupon-section").then((m) => ({ default: m.CouponSection })),
  { ssr: false }
);

export function CouponSectionLazy() {
  return <CouponSection />;
}
