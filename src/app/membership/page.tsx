"use client";

import {
  Check,
  ChevronRight,
  Coins,
  Crown,
  Gift,
  History,
  Sparkles,
  Star,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import {
  MEMBERSHIP_TIERS,
  getNextTier,
  getTierBySpend,
} from "@/lib/membership";
import {
  useMembershipHydrated,
  useMembershipStore,
} from "@/store/membership-store";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

const tierStyles = {
  silver: {
    card: "bg-[linear-gradient(135deg,#f4f4f4,#d8d8d8)] text-[#494949]",
    icon: "bg-white/60 text-[#777]",
  },
  gold: {
    card: "bg-[linear-gradient(135deg,#fff5ce,#e9bc55)] text-[#6a4700]",
    icon: "bg-white/55 text-[#a87500]",
  },
  platinum: {
    card: "bg-[linear-gradient(135deg,#3c3433,#151313)] text-white",
    icon: "bg-white/12 text-[#f6d58f]",
  },
};

export default function MembershipPage() {
  const hydrated = useMembershipHydrated();
  const points = useMembershipStore((state) => state.points);
  const lifetimeSpend = useMembershipStore((state) => state.lifetimeSpend);
  const transactions = useMembershipStore((state) => state.transactions);
  const currentTier = getTierBySpend(lifetimeSpend);
  const nextTier = getNextTier(currentTier.id);
  const progress = nextTier
    ? Math.min(
        ((lifetimeSpend - currentTier.minimumSpend) /
          (nextTier.minimumSpend - currentTier.minimumSpend)) *
          100,
        100,
      )
    : 100;

  return (
    <>
      <AppHeader
        title="สมาชิกและคะแนน"
        showBack
        showCart={false}
        showNotifications={false}
      />
      <PageContainer className="space-y-4 pt-4">
        <section className="relative overflow-hidden rounded-card bg-[linear-gradient(135deg,#352b2a_0%,#5f4b45_50%,#211a19_100%)] p-5 text-white shadow-[0_16px_38px_rgba(48,34,31,0.24)]">
          <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/7" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                PonPon Official Member
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Crown className="h-6 w-6 text-[#f6d58f]" />
                <h1 className="text-2xl font-extrabold">
                  {currentTier.name}
                </h1>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right ring-1 ring-white/10">
              <p className="text-[10px] font-bold text-white/60">
                คะแนนคงเหลือ
              </p>
              <p className="flex items-center justify-end gap-1 text-xl font-extrabold text-[#f6d58f]">
                <Coins className="h-5 w-5" />
                {hydrated ? points.toLocaleString("th-TH") : "—"}
              </p>
            </div>
          </div>

          <div className="relative mt-6">
            <div className="flex justify-between text-[11px] font-semibold text-white/70">
              <span>
                ยอดสะสม ฿{lifetimeSpend.toLocaleString("th-TH")}
              </span>
              <span>
                {nextTier
                  ? `เป้าหมาย ฿${nextTier.minimumSpend.toLocaleString("th-TH")}`
                  : "ระดับสูงสุด"}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#e9bd5e,#fff0bc)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-white/75">
              {nextTier
                ? `ช้อปอีก ฿${Math.max(nextTier.minimumSpend - lifetimeSpend, 0).toLocaleString("th-TH")} เพื่อเลื่อนเป็น ${nextTier.name}`
                : "ขอบคุณที่เป็นสมาชิกระดับสูงสุดของเรา"}
            </p>
          </div>
        </section>

        <Card className="grid grid-cols-3 gap-2 p-3">
          <div className="rounded-2xl bg-[#fff8f6] p-3 text-center">
            <Coins className="mx-auto h-5 w-5 text-brand" />
            <p className="mt-1 text-sm font-extrabold text-ink">
              x{currentTier.pointMultiplier}
            </p>
            <p className="text-[10px] text-ink-soft">ตัวคูณคะแนน</p>
          </div>
          <div className="rounded-2xl bg-[#fff8f6] p-3 text-center">
            <Gift className="mx-auto h-5 w-5 text-brand" />
            <p className="mt-1 text-sm font-extrabold text-ink">100 = ฿10</p>
            <p className="text-[10px] text-ink-soft">มูลค่าคะแนน</p>
          </div>
          <div className="rounded-2xl bg-[#fff8f6] p-3 text-center">
            <Star className="mx-auto h-5 w-5 text-brand" />
            <p className="mt-1 text-sm font-extrabold text-ink">
              {currentTier.benefits.length}
            </p>
            <p className="text-[10px] text-ink-soft">สิทธิ์ปัจจุบัน</p>
          </div>
        </Card>

        <section>
          <div className="mb-2 flex items-end justify-between px-1">
            <div>
              <h2 className="text-sm font-extrabold text-ink">ระดับสมาชิก</h2>
              <p className="text-[10px] text-ink-soft">
                ระดับคำนวณจากยอดซื้อสะสม
              </p>
            </div>
          </div>
          <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
            {MEMBERSHIP_TIERS.map((tier) => {
              const active = tier.id === currentTier.id;
              const style = tierStyles[tier.id];
              return (
                <article
                  key={tier.id}
                  className={cn(
                    "w-[82%] shrink-0 snap-center rounded-card p-4 shadow-sm ring-1 ring-black/[0.05] md:w-[48%]",
                    style.card,
                    active && "ring-2 ring-brand",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl",
                        style.icon,
                      )}
                    >
                      <Crown className="h-5 w-5" />
                    </span>
                    {active ? (
                      <span className="flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-extrabold text-white">
                        <Check className="h-3 w-3" />
                        ระดับของคุณ
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold opacity-65">
                        เริ่ม ฿{tier.minimumSpend.toLocaleString("th-TH")}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold">{tier.name}</h3>
                  <p className="text-xs font-bold opacity-70">
                    คะแนน x{tier.pointMultiplier}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {tier.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-2 text-xs font-semibold"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink">
              <History className="h-4 w-4 text-brand" />
              ประวัติคะแนน
            </h2>
            <span className="text-[10px] font-bold text-ink-soft">
              ล่าสุด {transactions.length} รายการ
            </span>
          </div>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-black/[0.05]">
              {transactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                      transaction.type === "earn"
                        ? "bg-success-soft text-success"
                        : transaction.type === "bonus"
                          ? "bg-warning-soft text-warning"
                          : "bg-brand-soft text-brand",
                    )}
                  >
                    {transaction.type === "bonus" ? (
                      <Sparkles className="h-5 w-5" />
                    ) : (
                      <Coins className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-ink">
                      {transaction.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-ink-soft">
                      {transaction.description} ·{" "}
                      {formatDate(transaction.createdAt)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-extrabold",
                      transaction.points >= 0 ? "text-success" : "text-brand",
                    )}
                  >
                    {transaction.points >= 0 ? "+" : ""}
                    {transaction.points.toLocaleString("th-TH")}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <Card className="flex items-center gap-3 bg-brand-soft/55 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
            <Gift className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-ink">
              การใช้คะแนนแลกรางวัล
            </p>
            <p className="text-xs leading-relaxed text-ink-soft">
              ทุก 100 คะแนน ใช้แทนส่วนลดได้ ฿10 ที่หน้าชำระเงิน
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-brand" />
        </Card>
      </PageContainer>
    </>
  );
}
