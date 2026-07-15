"use client";

import { useEffect, useState } from "react";
import {
  clearStoredPonPonSession,
  getPonPonMe,
} from "@/features/auth/ponpon-auth";
import { bootstrapLineSession } from "@/components/layout/liff-auth-bootstrap";
import { PONPON_LIFF_ID, PONPON_SKIP_LINE_LIFF } from "@/lib/auth-config";
import { initLiff, isLiffLoggedIn, loginWithLine } from "@/lib/liff";
import { mockCustomerProfile } from "@/lib/mock-data";
import type { LiffProfile } from "@/types/liff";

const LOGIN_FLOW_KEY = "ponpon.line_login_inflight";
const LOGIN_FLOW_STARTED_AT_KEY = "ponpon.line_login_started_at";
const LOGIN_FLOW_STALE_MS = 90_000;
const PROFILE_LIFF_INIT_TIMEOUT_MS = 5000;
const PROFILE_ME_BOOTSTRAP_DELAY_MS = 500;
const PROFILE_ME_TIMEOUT_MS = 5000;
const PROFILE_BOOTSTRAP_TIMEOUT_MS = 5000;

interface UseLiffProfileResult {
  profile: LiffProfile | null;
  loading: boolean;
  error: string | null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), timeoutMs)
    ),
  ]);
}

function clearLoginFlow(): void {
  sessionStorage.removeItem(LOGIN_FLOW_KEY);
  sessionStorage.removeItem(LOGIN_FLOW_STARTED_AT_KEY);
}

function markLoginFlowStarted(): void {
  sessionStorage.setItem(LOGIN_FLOW_KEY, "1");
  sessionStorage.setItem(LOGIN_FLOW_STARTED_AT_KEY, String(Date.now()));
}

function isLoginFlowFresh(): boolean {
  if (sessionStorage.getItem(LOGIN_FLOW_KEY) !== "1") return false;
  const startedAt = Number(sessionStorage.getItem(LOGIN_FLOW_STARTED_AT_KEY) ?? 0);

  if (!startedAt || Date.now() - startedAt > LOGIN_FLOW_STALE_MS) {
    clearLoginFlow();
    return false;
  }

  return true;
}

function isAuthRejection(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("status 401") ||
      error.message.includes("status 403"))
  );
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

    function startLineLogin(reason?: unknown) {
      clearStoredPonPonSession();

      if (reason instanceof Error) {
        console.warn("[ponpon-auth] /me failed, starting LINE login", reason);
      } else {
        console.warn("[ponpon-auth] /me failed, starting LINE login", reason);
      }

      setError("กำลังเข้าสู่ระบบใหม่ผ่าน LINE");
      setLoading(false);

      if (isLoginFlowFresh()) {
        return;
      }

      markLoginFlowStarted();
      void loginWithLine({ force: true }).catch((loginError) => {
        clearLoginFlow();
        if (cancelled) return;

        const message =
          loginError instanceof Error
            ? loginError.message
            : "ไม่สามารถเข้าสู่ระบบ LINE ใหม่ได้";
        setError(message);
      });
    }

    async function getPonPonMeAfterBootstrap() {
      try {
        return await withTimeout(
          getPonPonMe(),
          PROFILE_ME_TIMEOUT_MS,
          "โหลดข้อมูลผู้ใช้ช้าเกินไป"
        );
      } catch (initialError) {
        console.info(
          "[ponpon-auth] /me failed; retrying after bootstrap",
          initialError
        );
        await withTimeout(
          bootstrapLineSession({ allowLogin: false }),
          PROFILE_BOOTSTRAP_TIMEOUT_MS,
          "ต่ออายุเซสชันช้าเกินไป"
        );
        await wait(PROFILE_ME_BOOTSTRAP_DELAY_MS);

        try {
          return await withTimeout(
            getPonPonMe(),
            PROFILE_ME_TIMEOUT_MS,
            "โหลดข้อมูลผู้ใช้ช้าเกินไป"
          );
        } catch (retryError) {
          throw retryError instanceof Error
            ? retryError
            : initialError instanceof Error
              ? initialError
              : new Error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
        }
      }
    }

    async function load() {
      try {
        if (PONPON_SKIP_LINE_LIFF) {
          if (!cancelled) {
            setProfile(mockCustomerProfile);
          }
          return;
        }

        await withTimeout(
          initLiff(PONPON_LIFF_ID),
          PROFILE_LIFF_INIT_TIMEOUT_MS,
          "LIFF init timed out"
        );

        if (!isLiffLoggedIn()) {
          startLineLogin(new Error("LINE session is not ready."));
          return;
        }

        const meProfile = await getPonPonMeAfterBootstrap();

        if (cancelled) return;

        setProfile({
          displayName: meProfile.displayName,
          lineUserId: meProfile.id,
          pictureUrl: meProfile.pictureUrl ?? "",
        });
      } catch (err) {
        if (!cancelled) {
          if (isAuthRejection(err)) {
            startLineLogin(err);
          } else {
            const message =
              err instanceof Error
                ? err.message
                : "ไม่สามารถโหลดข้อมูลผู้ใช้ได้";
            console.warn("[ponpon-auth] profile load failed without re-login", err);
            setError(message);
          }
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
