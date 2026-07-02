"use client";

import { useEffect, useState } from "react";
import {
  exchangeLineIdToken,
  getPonPonMe,
} from "@/features/auth/ponpon-auth";
import { PONPON_LIFF_ID, PONPON_SKIP_LINE_LIFF } from "@/lib/auth-config";
import {
  getLiffProfile,
  getLiffTokens,
  initLiff,
  isLiffLoggedIn,
} from "@/lib/liff";
import { mockCustomerProfile } from "@/lib/mock-data";
import type { LiffProfile } from "@/types/liff";

interface UseLiffProfileResult {
  profile: LiffProfile | null;
  loading: boolean;
  error: string | null;
}

async function getPonPonMeWithFreshTokenOn401() {
  try {
    return await getPonPonMe();
  } catch (error) {
    const shouldRetry =
      error instanceof Error && error.message.includes("status 401");

    if (!shouldRetry) {
      throw error;
    }

    console.info(
      "[ponpon-auth] /me rejected stored JWT; exchanging LIFF token and retrying once"
    );
    const tokens = await getLiffTokens();
    await exchangeLineIdToken(tokens);
    return getPonPonMe();
  }
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
          if (!cancelled) {
            setError("กรุณาเข้าสู่ระบบใหม่ผ่าน LINE");
          }
          return;
        }

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("โหลดข้อมูลผู้ใช้ช้าเกินไป")), 8000)
        );
        const [lineProfile, meProfile] = await Promise.race([
          Promise.all([getLiffProfile(), getPonPonMeWithFreshTokenOn401()]),
          timeout,
        ]);

        const result: LiffProfile = {
          displayName: meProfile.displayName || lineProfile.displayName,
          lineUserId: lineProfile.lineUserId || meProfile.id,
          pictureUrl: meProfile.pictureUrl ?? lineProfile.pictureUrl,
        };

        if (!cancelled) {
          setProfile(result);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลผู้ใช้ได้";
          const normalizedMessage = message.includes("status 401")
            ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
            : message.includes("status 403")
              ? "ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาเข้าสู่ระบบใหม่"
              : message;

          setError(normalizedMessage);
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
