"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Gift,
  Send,
  Share2,
  Sparkles,
  TicketPercent,
  UserPlus,
  Users,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { useReferralHydrated, useReferralStore } from "@/store/referral-store";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

export default function ReferralsPage() {
  const hydrated = useReferralHydrated();
  const referralCode = useReferralStore((state) => state.referralCode);
  const acceptedReferralCode = useReferralStore(
    (state) => state.acceptedReferralCode,
  );
  const rewards = useReferralStore((state) => state.rewards);
  const friends = useReferralStore((state) => state.friends);
  const acceptReferralCode = useReferralStore(
    (state) => state.acceptReferralCode,
  );

  const [copied, setCopied] = useState<string | null>(null);
  const [friendCode, setFriendCode] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const shareText = useMemo(
    () =>
      `ช้อป PonPon Official แล้วรับส่วนลด ฿50 ใช้รหัส ${referralCode}`,
    [referralCode],
  );
  const completedFriends = friends.filter(
    (friend) => friend.status === "ordered",
  ).length;
  const availableRewards = rewards.filter(
    (reward) => reward.status === "available",
  ).length;

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard can be blocked in some embedded browsers; visual feedback is enough for this demo.
    }
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "PonPon Official",
          text: shareText,
        });
        return;
      } catch {
        // Fall through to clipboard when share sheet is dismissed/unavailable.
      }
    }
    copyText(shareText);
  };

  const submitFriendCode = () => {
    const result = acceptReferralCode(friendCode);
    setMessage(result.message);
    setIsError(!result.ok);
    if (result.ok) setFriendCode("");
  };

  return (
    <>
      <AppHeader
        title="แนะนำเพื่อน"
        showBack
        showCart={false}
        showNotifications={false}
      />
      <PageContainer className="space-y-4 pt-4">
        <section className="relative overflow-hidden rounded-card bg-brand p-5 text-white shadow-[0_16px_36px_rgba(190,9,14,0.25)]">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white/75">
                Referral Program
              </p>
              <h1 className="mt-1 text-2xl font-extrabold">
                ชวนเพื่อนรับคูปองทั้งคู่
              </h1>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/80">
                เพื่อนใช้รหัสของคุณรับส่วนลด ฿50 และเมื่อเพื่อนสั่งซื้อสำเร็จ
                คุณก็รับคูปอง ฿50 เช่นกัน
              </p>
            </div>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white/18 text-white shadow-inner">
              <UserPlus className="h-7 w-7" />
            </span>
          </div>

          <div className="relative mt-5 rounded-3xl bg-white p-3 text-ink shadow-[0_12px_26px_rgba(83,0,3,0.2)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-soft">
              รหัสแนะนำของฉัน
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 rounded-2xl bg-[#fff8f6] px-4 py-3 text-center text-xl font-extrabold tracking-[0.18em] text-brand">
                {hydrated ? referralCode : "LOADING"}
              </code>
              <button
                type="button"
                onClick={() => copyText(referralCode)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_8px_18px_rgba(190,9,14,0.25)]"
                aria-label="คัดลอกรหัสแนะนำ"
              >
                {copied === referralCode ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={shareReferral}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-soft text-sm font-extrabold text-brand transition active:scale-[0.98]"
            >
              <Share2 className="h-4 w-4" />
              แชร์ให้เพื่อน
            </button>
          </div>
        </section>

        <Card className="grid grid-cols-3 gap-2 p-3">
          <div className="rounded-2xl bg-[#fff8f6] p-3 text-center">
            <Users className="mx-auto h-5 w-5 text-brand" />
            <p className="mt-1 text-lg font-extrabold text-ink">
              {friends.length}
            </p>
            <p className="text-[10px] text-ink-soft">เพื่อนที่เข้าร่วม</p>
          </div>
          <div className="rounded-2xl bg-[#fff8f6] p-3 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-brand" />
            <p className="mt-1 text-lg font-extrabold text-ink">
              {completedFriends}
            </p>
            <p className="text-[10px] text-ink-soft">สั่งซื้อแล้ว</p>
          </div>
          <div className="rounded-2xl bg-[#fff8f6] p-3 text-center">
            <TicketPercent className="mx-auto h-5 w-5 text-brand" />
            <p className="mt-1 text-lg font-extrabold text-ink">
              {availableRewards}
            </p>
            <p className="text-[10px] text-ink-soft">คูปองรางวัล</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Gift className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-ink">
                มีรหัสจากเพื่อน?
              </h2>
              <p className="text-[11px] text-ink-soft">
                กรอกเพื่อรับคูปองสำหรับลูกค้าใหม่
              </p>
            </div>
          </div>
          {acceptedReferralCode ? (
            <div className="rounded-2xl border border-success/20 bg-success-soft px-3 py-3 text-sm font-extrabold text-success">
              ใช้รหัส {acceptedReferralCode} แล้ว รับคูปองเพื่อนใหม่เรียบร้อย
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  value={friendCode}
                  onChange={(event) =>
                    setFriendCode(event.target.value.toUpperCase())
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitFriendCode();
                  }}
                  placeholder="เช่น PONPON128"
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-black/10 bg-[#fffaf8] px-4 text-sm font-bold uppercase text-ink outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
                />
                <button
                  type="button"
                  onClick={submitFriendCode}
                  disabled={!friendCode.trim()}
                  className="brand-button flex h-11 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send className="h-4 w-4" />
                  รับ
                </button>
              </div>
              {message ? (
                <p
                  className={cn(
                    "mt-2 text-xs font-bold",
                    isError ? "text-brand" : "text-success",
                  )}
                >
                  {message}
                </p>
              ) : null}
            </>
          )}
        </Card>

        <section>
          <h2 className="mb-2 px-1 text-sm font-extrabold text-ink">
            คูปองรางวัลของฉัน
          </h2>
          <div className="space-y-3">
            {rewards.map((reward) => {
              const available = reward.status === "available";
              return (
                <Card
                  key={reward.id}
                  className={cn("overflow-hidden", !available && "opacity-70")}
                >
                  <div className="flex">
                    <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-brand px-3 py-5 text-center text-white">
                      <TicketPercent className="mb-2 h-5 w-5" />
                      <span className="text-xl font-extrabold leading-none">
                        {reward.value}
                      </span>
                      <span className="mt-1 text-[10px] font-bold text-white/80">
                        Referral
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-extrabold text-ink">
                            {reward.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                            {reward.description}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-extrabold",
                            available
                              ? "bg-success-soft text-success"
                              : "bg-surface-muted text-ink-soft",
                          )}
                        >
                          {available ? "พร้อมใช้" : "ใช้แล้ว"}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[#fff8f6] px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-ink-soft">
                            CODE
                          </p>
                          <p className="truncate text-xs font-extrabold tracking-wide text-ink">
                            {reward.code}
                          </p>
                        </div>
                        {available ? (
                          <div className="flex shrink-0 gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyText(reward.code)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand shadow-sm ring-1 ring-brand/10"
                              aria-label={`คัดลอกโค้ด ${reward.code}`}
                            >
                              {copied === reward.code ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <Link
                              href={`/checkout?promo=${reward.code}`}
                              className="brand-button flex h-8 items-center rounded-full px-3 text-xs font-extrabold text-white"
                            >
                              ใช้เลย
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-sm font-extrabold text-ink">
            เพื่อนที่แนะนำ
          </h2>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-black/[0.05]">
              {friends.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Users className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-ink">
                      {friend.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-soft">
                      เข้าร่วมเมื่อ {formatDate(friend.joinedAt)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-extrabold",
                      friend.status === "ordered"
                        ? "bg-success-soft text-success"
                        : "bg-warning-soft text-warning",
                    )}
                  >
                    {friend.status === "ordered" ? "สั่งซื้อแล้ว" : "รอออเดอร์"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </PageContainer>
    </>
  );
}
