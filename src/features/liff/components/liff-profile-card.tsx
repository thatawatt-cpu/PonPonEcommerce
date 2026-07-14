"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { LiffProfile } from "@/types/liff";

interface LiffProfileCardProps {
  profile: LiffProfile | null;
  loading: boolean;
  error?: string | null;
  onRetryLogin?: () => void;
}

export function LiffProfileCard({
  profile,
  loading,
  error,
  onRetryLogin,
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
      <Card className="space-y-3 p-4">
        <div className="text-sm text-ink-soft">
          {error ?? "ไม่พบโปรไฟล์"}
        </div>
        {onRetryLogin && (
          <button
            type="button"
            onClick={onRetryLogin}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white transition active:scale-[0.98]"
          >
            <Loader2 className="h-4 w-4" />
            เข้าสู่ระบบใหม่
          </button>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-light to-brand text-2xl text-white">
          {profile.pictureUrl ? (
            <Image
              src={profile.pictureUrl}
              alt={profile.displayName}
              width={64}
              height={64}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            "🧑"
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">
            {profile.displayName}
          </p>
        </div>
      </div>
    </Card>
  );
}
