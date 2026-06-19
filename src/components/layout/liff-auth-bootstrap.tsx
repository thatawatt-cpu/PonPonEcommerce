"use client";

import { useEffect } from "react";
import { exchangeLineIdToken } from "@/features/auth/ponpon-auth";
import { PONPON_LIFF_ID, PONPON_SKIP_LINE_LIFF } from "@/lib/auth-config";
import {
  getLiffTokens,
  initLiff,
  isLiffLoggedIn,
  loginWithLine,
} from "@/lib/liff";

const REAUTH_KEY = "ponpon.reauth_at";
const REAUTH_DEBOUNCE_MS = 60_000;

function getIdTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isIdTokenExpired(token: string): boolean {
  const exp = getIdTokenExpiry(token);
  if (exp === null) return false;
  // 30s buffer — ถ้าเหลือน้อยกว่า 30s ให้ถือว่า expire แล้ว
  return Date.now() >= (exp - 30) * 1000;
}

let bootstrapPromise: Promise<void> | null = null;

async function bootstrapLineSession(): Promise<void> {
  const lastReauthAt = Number(localStorage.getItem(REAUTH_KEY) ?? 0);
  const recentlyAttempted = Date.now() - lastReauthAt < REAUTH_DEBOUNCE_MS;

  console.info("[ponpon-auth] bootstrap start", {
    skipLiff: PONPON_SKIP_LINE_LIFF,
    recentlyAttempted,
  });

  await initLiff(PONPON_LIFF_ID);

  if (!isLiffLoggedIn()) {
    if (PONPON_SKIP_LINE_LIFF) {
      console.warn("[ponpon-auth] not logged in (dev mode) — no JWT obtained");
      return;
    }
    console.info("[ponpon-auth] not logged in, redirecting to LINE login");
    await loginWithLine();
    return;
  }

  const { idToken, accessToken } = await getLiffTokens();

  if (!idToken) {
    throw new Error("LINE idToken is not available.");
  }

  const exp = getIdTokenExpiry(idToken);
  const expired = isIdTokenExpired(idToken);
  console.info("[ponpon-auth] tokens ready", {
    isJwt: idToken.startsWith("eyJ"),
    exp: exp ? new Date(exp * 1000).toISOString() : null,
    expired,
    hasAccessToken: Boolean(accessToken),
  });

  // ตรวจ expiry ก่อนส่ง — ถ้า token หมดอายุแล้วให้ redirect ขอ token ใหม่ทันที
  if (expired && !PONPON_SKIP_LINE_LIFF && !recentlyAttempted) {
    console.info("[ponpon-auth] idToken expired — redirecting for fresh LIFF session");
    localStorage.setItem(REAUTH_KEY, String(Date.now()));
    await loginWithLine();
    return;
  }

  if (expired) {
    console.warn("[ponpon-auth] idToken expired and already retried — continuing unauthenticated");
    return;
  }

  try {
    const session = await exchangeLineIdToken({ idToken, accessToken });
    localStorage.removeItem(REAUTH_KEY);
    console.info("[ponpon-auth] jwt received", {
      hasJwt: Boolean(session.jwt),
      hasRefreshToken: Boolean(session.refreshToken),
    });
  } catch (error) {
    const is401 =
      error instanceof Error && error.message.includes("status 401");

    if (is401 && !PONPON_SKIP_LINE_LIFF && !recentlyAttempted) {
      console.info("[ponpon-auth] token rejected by backend — retrying with fresh LINE login");
      localStorage.setItem(REAUTH_KEY, String(Date.now()));
      await loginWithLine();
      return;
    }

    console.warn("[ponpon-auth] auth failed, continuing unauthenticated", error);
  }
}

export function LiffAuthBootstrap() {
  useEffect(() => {
    if (!bootstrapPromise) {
      bootstrapPromise = bootstrapLineSession().catch((error) => {
        console.error("[ponpon-auth] LIFF bootstrap failed", error);
      }).finally(() => {
        bootstrapPromise = null;
      });
    }
  }, []);

  return null;
}
