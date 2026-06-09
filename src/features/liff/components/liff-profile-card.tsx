"use client";

import { Card } from "@/components/ui/card";
import type { LiffProfile } from "@/types/liff";

interface LiffProfileCardProps {
  profile: LiffProfile | null;
  loading: boolean;
  error?: string | null;
}

export function LiffProfileCard({
  profile,
  loading,
  error,
}: LiffProfileCardProps) {
  if (loading) {
    return (
      <Card className="flex items-center gap-4 p-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-surface-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-muted" />
          <div className="h-3 w-40 animate-pulse rounded bg-surface-muted" />
        </div>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className="p-4 text-sm text-ink-soft">
        {error ?? "ไม่พบโปรไฟล์"}
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-light to-brand text-2xl text-white">
          {/* Mock avatar — initials in lieu of a real LINE picture. */}
          🧑
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">
            {profile.displayName}
          </p>
          <p className="truncate text-xs text-ink-soft">
            LINE ID: {profile.lineUserId}
          </p>
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand">
        * นี่คือข้อมูลโปรไฟล์ LIFF จำลอง (mock) ยังไม่ได้เชื่อมต่อ LINE
        จริง
      </p>
    </Card>
  );
}
