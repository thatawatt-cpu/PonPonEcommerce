"use client";

import { useState } from "react";
import { Check, TicketPercent } from "lucide-react";
import { cn } from "@/lib/utils";

const coupons = [
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

export function CouponSection() {
  const [claimed, setClaimed] = useState<string[]>([]);

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

      <div className="no-scrollbar -mx-3.5 flex gap-2.5 overflow-x-auto px-3.5 pb-1">
        {coupons.map((coupon) => {
          const isClaimed = claimed.includes(coupon.id);
          return (
            <article
              key={coupon.id}
              className="relative flex min-w-[18rem] flex-1 overflow-hidden rounded-card bg-white shadow-[0_8px_22px_rgba(65,25,25,0.08)] ring-1 ring-brand/10"
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
                    "flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-xs font-bold transition",
                    isClaimed
                      ? "bg-success-soft text-success"
                      : "brand-button text-white"
                  )}
                >
                  {isClaimed && <Check className="h-3.5 w-3.5" />}
                  {isClaimed ? "เก็บแล้ว" : "เก็บ"}
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
