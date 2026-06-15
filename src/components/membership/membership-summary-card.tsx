"use client";

import Link from "next/link";
import { ChevronRight, Coins, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getNextTier, getTierBySpend } from "@/lib/membership";
import {
  useMembershipHydrated,
  useMembershipStore,
} from "@/store/membership-store";

export function MembershipSummaryCard() {
  const hydrated = useMembershipHydrated();
  const points = useMembershipStore((state) => state.points);
  const lifetimeSpend = useMembershipStore((state) => state.lifetimeSpend);
  const tier = getTierBySpend(lifetimeSpend);
  const nextTier = getNextTier(tier.id);
  const progress = nextTier
    ? Math.min(
        ((lifetimeSpend - tier.minimumSpend) /
          (nextTier.minimumSpend - tier.minimumSpend)) *
          100,
        100,
      )
    : 100;

  return (
    <Link href="/membership" className="group block">
      <Card className="relative overflow-hidden bg-[linear-gradient(135deg,#352b2a_0%,#5f4b45_52%,#221b1a_100%)] p-4 text-white shadow-[0_14px_32px_rgba(51,37,34,0.2)] transition group-hover:-translate-y-0.5">
        <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-white/8" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-[#f6d58f] ring-1 ring-white/15">
              <Crown className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                PonPon Member
              </p>
              <p className="text-lg font-extrabold">{tier.name}</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-extrabold text-[#f6d58f]">
            <Coins className="h-4 w-4" />
            {hydrated ? points.toLocaleString("th-TH") : "—"}
          </span>
        </div>

        <div className="relative mt-4">
          <div className="flex items-end justify-between gap-3 text-[11px]">
            <span className="font-semibold text-white/70">
              {nextTier
                ? `อีก ฿${Math.max(nextTier.minimumSpend - lifetimeSpend, 0).toLocaleString("th-TH")} ถึง ${nextTier.name}`
                : "คุณอยู่ระดับสูงสุดแล้ว"}
            </span>
            <span className="flex items-center font-extrabold">
              ดูสิทธิ์
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/12">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#f0c96d,#fff0bc)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
