"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Heart,
  HelpCircle,
  MapPin,
  MessageCircle,
  PackageSearch,
  UserPlus,
  Settings,
  ShieldCheck,
  TicketPercent,
  type LucideIcon,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { LiffProfileCard } from "@/features/liff/components/liff-profile-card";
import { MembershipSummaryCard } from "@/components/membership/membership-summary-card";
import { useLiffProfile } from "@/features/liff/hooks/use-liff-profile";
import { loginWithLine, openExternalWindow } from "@/lib/liff";
import { LINE_OA_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  useFavoriteStore,
  useFavoritesHydrated,
} from "@/store/favorite-store";

interface Shortcut {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

export default function ProfilePage() {
  const { profile, loading, error } = useLiffProfile();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const favoritesHydrated = useFavoritesHydrated();
  const favoriteCount = useFavoriteStore(
    (state) => state.productIds.length,
  );

  const shortcuts: Shortcut[] = [
    { label: "ออเดอร์ของฉัน", icon: PackageSearch, href: "/orders" },
    {
      label: "ติดต่อร้าน",
      icon: MessageCircle,
      onClick: () => openExternalWindow(LINE_OA_URL),
    },
    { label: "ที่อยู่จัดส่ง", icon: MapPin, href: "/addresses" },
    { label: "แนะนำเพื่อน", icon: UserPlus, href: "/referrals" },
  ];

  const benefits = [
    {
      label: "คูปองของฉัน",
      value: "5",
      icon: TicketPercent,
      href: "/coupons",
    },
    {
      label: "สินค้าที่ถูกใจ",
      value: favoritesHydrated ? String(favoriteCount) : "0",
      icon: Heart,
      href: "/favorites",
    },
    {
      label: "ดูล่าสุด",
      value: "12",
      icon: Clock3,
      href: "/recently-viewed",
    },
  ];

  const notifications = [
    {
      title: "กำลังตรวจสอบการชำระเงิน ORD001",
      description: "ร้านได้รับหลักฐานการชำระเงินแล้ว",
      time: "5 นาทีที่แล้ว",
      href: "/orders/ORD001",
      icon: PackageSearch,
    },
    {
      title: "คูปองใหม่พร้อมใช้",
      description: "ลด ฿50 เมื่อช้อปครบ ฿499",
      time: "1 ชม. ที่แล้ว",
      href: "/coupons",
      icon: TicketPercent,
    },
    {
      title: "Flash Sale เริ่มแล้ว",
      description: "ดีลพิเศษจำนวนจำกัดสำหรับคุณ",
      time: "วันนี้ 09:00",
      href: "/products",
      icon: Bell,
    },
  ];

  const handleRetryLogin = async () => {
    await loginWithLine();
    window.location.reload();
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
        <MembershipSummaryCard />

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
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-ink">
              การแจ้งเตือนล่าสุด
            </h2>
            <Link
                href="/notifications"
                className="flex items-center gap-1 text-[11px] font-extrabold text-brand"
              >
                ดูแจ้งเตือนทั้งหมด
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
          </div>
          <Card className="overflow-hidden">
            {!notificationsEnabled ? (
              <div className="px-4 py-5 text-center">
                <Bell className="mx-auto h-6 w-6 text-ink-soft/50" />
                <p className="mt-2 text-sm font-bold text-ink">
                  ปิดการแจ้งเตือนอยู่
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  เปิดสวิตช์ด้านล่างเพื่อรับสถานะออเดอร์และโปรโมชัน
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.05]">
                {notifications.map((notification, index) => {
                  const Icon = notification.icon;
                  const unread = index < 2;
                  return (
                    <li key={notification.title}>
                      <Link
                        href={notification.href}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3.5 transition active:bg-brand-soft",
                          unread && "bg-brand-soft/35"
                        )}
                      >
                        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
                          <Icon className="h-5 w-5" />
                          {unread && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold text-ink">
                            {notification.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                            {notification.description}
                          </span>
                          <span className="mt-1 block text-[10px] font-semibold text-ink-soft/75">
                            {notification.time}
                          </span>
                        </span>
                        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-ink-soft" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
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
            <li>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Bell className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-ink">
                    การแจ้งเตือน
                  </span>
                  <span className="block text-[10px] text-ink-soft">
                    สถานะออเดอร์และโปรโมชัน
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-label="การแจ้งเตือน"
                  aria-checked={notificationsEnabled}
                  onClick={() => setNotificationsEnabled((value) => !value)}
                  className={`relative h-7 w-12 rounded-full transition ${
                    notificationsEnabled ? "bg-brand" : "bg-black/15"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      notificationsEnabled ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </li>
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
