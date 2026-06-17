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

let bootstrapPromise: Promise<void> | null = null;

async function bootstrapLineSession(): Promise<void> {
  console.info("[ponpon-auth] bootstrap start");

  if (PONPON_SKIP_LINE_LIFF) {
    console.info("[ponpon-auth] skipping LIFF bootstrap in dev");
    return;
  }

  await initLiff(PONPON_LIFF_ID);

  if (!isLiffLoggedIn()) {
    console.info("[ponpon-auth] not logged in, redirecting to LINE login");
    await loginWithLine();
    return;
  }

  const { idToken, accessToken } = await getLiffTokens();
  console.info("[ponpon-auth] tokens ready, sending idToken to app route");

  if (!idToken) {
    throw new Error("LINE idToken is not available.");
  }

  const session = await exchangeLineIdToken({ idToken, accessToken });
  console.info("[ponpon-auth] jwt received", {
    hasJwt: Boolean(session.jwt),
    hasRefreshToken: Boolean(session.refreshToken),
  });
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
