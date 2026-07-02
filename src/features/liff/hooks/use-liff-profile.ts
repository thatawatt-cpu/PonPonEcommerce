"use client";

import { useEffect, useState } from "react";
import {
  clearStoredPonPonSession,
  getPonPonMe,
} from "@/features/auth/ponpon-auth";
import { PONPON_LIFF_ID, PONPON_SKIP_LINE_LIFF } from "@/lib/auth-config";
import { initLiff, isLiffLoggedIn, loginWithLine } from "@/lib/liff";
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

    async function reloginWithLine(reason?: unknown) {
      clearStoredPonPonSession();

      if (reason instanceof Error) {
        console.warn("[ponpon-auth] /me failed, forcing LINE login", reason);
      } else {
        console.warn("[ponpon-auth] /me failed, forcing LINE login", reason);
      }

      await loginWithLine();
    }

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
          await reloginWithLine(new Error("LINE session is not ready."));
          return;
        }

        const meProfile = await getPonPonMe();

        if (cancelled) return;

        setProfile({
          displayName: meProfile.displayName,
          lineUserId: meProfile.id,
          pictureUrl: meProfile.pictureUrl ?? "",
        });
      } catch (err) {
        if (cancelled) return;

        try {
          await reloginWithLine(err);
          return;
        } catch (loginError) {
          const message =
            loginError instanceof Error
              ? loginError.message
              : "ไม่สามารถเข้าสู่ระบบ LINE ใหม่ได้";
          setError(message);
          return;
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
