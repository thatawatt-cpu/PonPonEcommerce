"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Heart,
  HelpCircle,
  MapPin,
  PackageSearch,
  Settings,
  ShieldCheck,
  TicketPercent,
  type LucideIcon,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { LiffProfileCard } from "@/features/liff/components/liff-profile-card";
// import { MembershipSummaryCard } from "@/components/membership/membership-summary-card";
import { useLiffProfile } from "@/features/liff/hooks/use-liff-profile";
import {
  clearStoredPonPonSession,
  getPonPonMe,
} from "@/features/auth/ponpon-auth";
import { loginWithLine } from "@/lib/liff";

const LOGIN_FLOW_KEY = "ponpon.line_login_inflight";
const REAUTH_KEY = "ponpon.reauth_at";

interface Shortcut {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

interface ProfileCounts {
  wishlistCount: number;
  couponCount: number;
  recentlyViewedCount: number;
}

export default function ProfilePage() {
  const { profile, loading, error } = useLiffProfile();
  const [profileCounts, setProfileCounts] = useState<ProfileCounts | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    getPonPonMe()
      .then((me) => {
        if (!cancelled) {
          setProfileCounts({
            wishlistCount: me.wishlistCount,
            couponCount: me.couponCount,
            recentlyViewedCount: me.recentlyViewedCount,
          });
        }
      })
      .catch((error: unknown) => {
        console.info("[profile] Count sync skipped", error);
        if (!cancelled) setProfileCounts(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const shortcuts: Shortcut[] = [
    { label: "ออเดอร์ของฉัน", icon: PackageSearch, href: "/orders" },
    { label: "ที่อยู่จัดส่ง", icon: MapPin, href: "/addresses" },
  ];

  const benefits = [
    {
      label: "คูปองของฉัน",
      value:
        profileCounts == null ? "…" : String(profileCounts.couponCount),
      icon: TicketPercent,
      href: "/coupons",
    },
    {
      label: "สินค้าที่ถูกใจ",
      value:
        profileCounts == null ? "…" : String(profileCounts.wishlistCount),
      icon: Heart,
      href: "/favorites",
    },
    {
      label: "ดูล่าสุด",
      value:
        profileCounts == null
          ? "…"
          : String(profileCounts.recentlyViewedCount),
      icon: Clock3,
      href: "/recently-viewed",
    },
  ];

  const handleRetryLogin = async () => {
    try {
      clearStoredPonPonSession();
      sessionStorage.removeItem(LOGIN_FLOW_KEY);
      localStorage.removeItem(REAUTH_KEY);
      await loginWithLine({ force: true });
    } catch (error) {
      console.error("[profile] login retry failed", error);
    }
  };

  return (
    <>
      <AppHeader title="โปรไฟล์" showCart={false} />
      <PageContainer className="space-y-4 pt-4">
        <LiffProfileCard
          profile={profile}
          loading={loading}
          error={error}
          onRetryLogin={handleRetryLogin}
        />
        {/*
        <MembershipSummaryCard />
        */}

        <section>
          <h2 className="mb-2 px-1 text-sm font-extrabold text-ink">
            สิทธิประโยชน์ของฉัน
          </h2>
          <Card className="grid grid-cols-3 gap-2 p-3">
            {benefits.map(({ label, value, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="flex min-w-0 flex-col items-center rounded-2xl bg-[#fff8f6] px-2 py-3 text-center transition active:scale-95"
              >
                <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white ring-2 ring-[#fff8f6]">
                    {value}
                  </span>
                </span>
                <span className="mt-2 truncate text-[11px] font-bold text-ink">
                  {label}
                </span>
              </Link>
            ))}
          </Card>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-sm font-extrabold text-ink">
            บัญชีและการตั้งค่า
          </h2>
        <Card className="overflow-hidden">
          <ul className="divide-y divide-black/5">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              const content = (
                <span className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink">
                    {item.label}
                  </span>
                  <ChevronRight className="h-5 w-5 text-ink-soft" />
                </span>
              );
              return (
                <li key={item.label}>
                  {item.href ? (
                    <Link href={item.href}>{content}</Link>
                  ) : (
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="w-full text-left"
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-sm font-extrabold text-ink">
            ช่วยเหลือและข้อมูล
          </h2>
          <Card className="overflow-hidden">
            <details className="group border-b border-black/[0.05]">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <HelpCircle className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-medium text-ink">
                  คำถามที่พบบ่อย
                </span>
                <ChevronDown className="h-5 w-5 text-ink-soft transition group-open:rotate-180" />
              </summary>
              <div className="space-y-3 bg-[#fffaf8] px-4 pb-4 pt-1 text-xs leading-relaxed text-ink-soft">
                <div>
                  <p className="font-bold text-ink">ติดตามออเดอร์ได้ที่ไหน?</p>
                  <p>เข้าเมนูออเดอร์ของฉัน แล้วเลือกเลขที่คำสั่งซื้อ</p>
                </div>
                <div>
                  <p className="font-bold text-ink">ใช้คูปองอย่างไร?</p>
                  <p>เลือกคูปองก่อนชำระเงิน ระบบจะคำนวณส่วนลดให้</p>
                </div>
              </div>
            </details>

            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-medium text-ink">
                  ความเป็นส่วนตัวและข้อกำหนด
                </span>
                <ChevronDown className="h-5 w-5 text-ink-soft transition group-open:rotate-180" />
              </summary>
              <div className="bg-[#fffaf8] px-4 pb-4 pt-1 text-xs leading-relaxed text-ink-soft">
                ข้อมูลในระบบนี้เป็นข้อมูลจำลองสำหรับทดสอบหน้าร้าน
                และยังไม่มีการส่งข้อมูลไปยัง LINE LIFF จริง
              </div>
            </details>
          </Card>
        </section>

        <div className="flex items-center justify-center gap-2 px-1 text-[11px] text-ink-soft">
          <Settings className="h-3.5 w-3.5" />
          <span>PonPon Official เวอร์ชัน 0.1.0</span>
          <span>·</span>
          <FileText className="h-3.5 w-3.5" />
          <span>Frontend Demo</span>
        </div>
      </PageContainer>
    </>
  );
}
