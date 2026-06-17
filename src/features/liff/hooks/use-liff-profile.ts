"use client";

import { useEffect, useState } from "react";
import { getPonPonMe } from "@/features/auth/ponpon-auth";
import { PONPON_SKIP_LINE_LIFF } from "@/lib/auth-config";
import { initLiff } from "@/lib/liff";
import { mockCustomerProfile } from "@/lib/mock-data";
import type { LiffProfile } from "@/types/liff";

interface UseLiffProfileResult {
  profile: LiffProfile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Loads the authenticated PonPon profile on mount.
 */
export function useLiffProfile(): UseLiffProfileResult {
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (PONPON_SKIP_LINE_LIFF) {
          if (!cancelled) {
            setProfile(mockCustomerProfile);
          }
          return;
        }

        await initLiff();
        const result = await getPonPonMe();
        if (!cancelled) {
          setProfile({
            displayName: result.displayName,
            lineUserId: result.id,
            pictureUrl: result.pictureUrl ?? "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "ไม่สามารถโหลดข้อมูลผู้ใช้ได้"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading, error };
}
