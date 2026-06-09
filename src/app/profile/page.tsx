"use client";

import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  MessageCircle,
  PackageSearch,
  type LucideIcon,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { LiffProfileCard } from "@/features/liff/components/liff-profile-card";
import { useLiffProfile } from "@/features/liff/hooks/use-liff-profile";
import { openExternalWindow } from "@/lib/liff";
import { LINE_OA_URL } from "@/lib/constants";

interface Shortcut {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

export default function ProfilePage() {
  const { profile, loading, error } = useLiffProfile();

  const shortcuts: Shortcut[] = [
    { label: "ออเดอร์ของฉัน", icon: PackageSearch, href: "/orders" },
    {
      label: "ติดต่อร้าน",
      icon: MessageCircle,
      onClick: () => openExternalWindow(LINE_OA_URL),
    },
    { label: "ที่อยู่จัดส่ง", icon: MapPin, href: "/checkout" },
  ];

  return (
    <>
      <AppHeader title="โปรไฟล์" showCart={false} />
      <PageContainer className="space-y-4 pt-4">
        <LiffProfileCard profile={profile} loading={loading} error={error} />

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

        <p className="px-1 text-center text-xs text-ink-soft">
          แอปนี้เป็นเดโม่ฝั่งหน้าร้าน (Frontend) ใช้ข้อมูลจำลองทั้งหมด
          และยังไม่ได้เชื่อมต่อ LINE LIFF จริง
        </p>
      </PageContainer>
    </>
  );
}
