"use client";

import { useEffect } from "react";
import {
  exchangeLineIdToken,
  isStoredJwtValid,
  getStoredLineRefreshToken,
  refreshPonPonSession,
} from "@/features/auth/ponpon-auth";
import { PONPON_LIFF_ID, PONPON_SKIP_LINE_LIFF } from "@/lib/auth-config";
import {
  getLiffTokens,
  initLiff,
  isLiffLoggedIn,
  loginWithLine,
} from "@/lib/liff";

const REAUTH_KEY = "ponpon.reauth_at";
const REAUTH_DEBOUNCE_MS = 60_000;
const LOGIN_FLOW_KEY = "ponpon.line_login_inflight";

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
  return Date.now() >= (exp - 30) * 1000;
}

let bootstrapPromise: Promise<void> | null = null;

async function bootstrapLineSession(): Promise<void> {
  const lastReauthAt = Number(localStorage.getItem(REAUTH_KEY) ?? 0);
  const recentlyAttempted = Date.now() - lastReauthAt < REAUTH_DEBOUNCE_MS;
  const loginInFlight = sessionStorage.getItem(LOGIN_FLOW_KEY) === "1";

  console.info("[ponpon-auth] bootstrap start", {
    skipLiff: PONPON_SKIP_LINE_LIFF,
    recentlyAttempted,
  });

  if (PONPON_SKIP_LINE_LIFF) {
    console.info("[ponpon-auth] skip mode — skipping LINE auth entirely");
    return;
  }

  await initLiff(PONPON_LIFF_ID);

  const storedRefreshToken = getStoredLineRefreshToken();
  if (storedRefreshToken) {
    try {
      const session = await refreshPonPonSession();
      sessionStorage.removeItem(LOGIN_FLOW_KEY);
      console.info("[ponpon-auth] jwt refreshed", {
        hasJwt: Boolean(session.jwt),
        hasRefreshToken: Boolean(session.refreshToken),
      });
      return;
    } catch {
      console.info("[ponpon-auth] refresh token unusable; checking LIFF session");
    }
  } else if (isStoredJwtValid()) {
    sessionStorage.removeItem(LOGIN_FLOW_KEY);
    console.info("[ponpon-auth] stored JWT still valid — skipping exchange");
    return;
  }

  if (!isLiffLoggedIn()) {
    if (loginInFlight || recentlyAttempted) {
      console.info("[ponpon-auth] LINE login already in progress; waiting");
      return;
    }

    console.info("[ponpon-auth] no LINE session, starting login flow");
    sessionStorage.setItem(LOGIN_FLOW_KEY, "1");
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

  if (expired && !recentlyAttempted) {
    console.info("[ponpon-auth] idToken expired — starting re-login flow");
    localStorage.setItem(REAUTH_KEY, String(Date.now()));
    sessionStorage.setItem(LOGIN_FLOW_KEY, "1");
    await loginWithLine();
    return;
  }

  if (expired) {
    console.warn(
      "[ponpon-auth] idToken expired and already retried — continuing unauthenticated"
    );
    return;
  }

  try {
    const session = await exchangeLineIdToken({ idToken, accessToken });
    localStorage.removeItem(REAUTH_KEY);
    sessionStorage.removeItem(LOGIN_FLOW_KEY);
    console.info("[ponpon-auth] jwt received", {
      hasJwt: Boolean(session.jwt),
      hasRefreshToken: Boolean(session.refreshToken),
    });
  } catch (error) {
    const is401 =
      error instanceof Error && error.message.includes("status 401");

    if (is401 && !recentlyAttempted) {
      console.info(
        "[ponpon-auth] token rejected by backend — starting re-login flow"
      );
      localStorage.setItem(REAUTH_KEY, String(Date.now()));
      sessionStorage.setItem(LOGIN_FLOW_KEY, "1");
      await loginWithLine();
      return;
    }

    console.warn("[ponpon-auth] auth failed, continuing unauthenticated", error);
  }
}

export function LiffAuthBootstrap() {
  useEffect(() => {
    if (!bootstrapPromise) {
      bootstrapPromise = bootstrapLineSession()
        .catch((error) => {
          console.error("[ponpon-auth] LIFF bootstrap failed", error);
        })
        .finally(() => {
          bootstrapPromise = null;
        });
    }
  }, []);

  return null;
}
