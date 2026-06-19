"use client";

import { useEffect, useState } from "react";
import { PONPON_LIFF_ID, PONPON_SKIP_LINE_LIFF } from "@/lib/auth-config";
import { getLiffProfile, initLiff, isLiffLoggedIn } from "@/lib/liff";
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

        await initLiff(PONPON_LIFF_ID);

        if (!isLiffLoggedIn()) {
          if (!cancelled) setError("กรุณาเปิดแอปผ่าน LINE");
          return;
        }

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("โหลดโปรไฟล์ช้าเกินไป")), 8000)
        );
        const result = await Promise.race([getLiffProfile(), timeout]);
        if (!cancelled) {
          setProfile(result);
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
