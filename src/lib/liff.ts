/**
 * LIFF adapter.
 *
 * The app runs with the real `window.liff` object when LINE injects it, and
 * falls back to mock data in local development.
 */
import { mockCustomerProfile } from "@/lib/mock-data";
import { PONPON_LIFF_ID, PONPON_SKIP_LINE_LIFF } from "@/lib/auth-config";
import type { LiffProfile } from "@/types/liff";

const MOCK_DELAY = 350;
let initPromise: Promise<{ ready: true }> | null = null;

type RuntimeLiff = {
  init?: (config: { liffId: string }) => Promise<unknown> | unknown;
  isLoggedIn?: () => boolean;
  login?: () => void | Promise<void>;
  getIDToken?: () => string | null | undefined;
  getAccessToken?: () => string | null | undefined;
  getProfile?: () => Promise<{
    displayName: string;
    userId: string;
    pictureUrl?: string;
  }>;
  openWindow?: (options: { url: string; external?: boolean }) => void;
  closeWindow?: () => void;
};

declare global {
  interface Window {
    liff?: RuntimeLiff;
  }
}

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function shouldUseMockLiff(): boolean {
  return PONPON_SKIP_LINE_LIFF || isLocalHost();
}

function wait<T>(value: T, ms = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Pretend to initialise the LIFF app with a liffId. Always succeeds. */
export async function initLiff(
  liffId: string = PONPON_LIFF_ID
): Promise<{ ready: true }> {
  if (initPromise) return initPromise;

  const runtime = typeof window !== "undefined" ? window.liff ?? null : null;

  initPromise = (async () => {
    if (runtime?.init) {
      if (liffId === "MOCK_LIFF_ID") {
        throw new Error("NEXT_PUBLIC_LIFF_ID is not configured.");
      }

      await runtime.init({ liffId });
      return { ready: true as const };
    }

    if (!shouldUseMockLiff()) {
      throw new Error(
        "LIFF SDK is not available on this host. Make sure the LINE LIFF script is loaded and the app is opened through LINE."
      );
    }

    if (typeof console !== "undefined") {
      console.info(`[mock-liff] initLiff(${liffId})`);
    }

    return wait({ ready: true as const });
  })().catch((error) => {
    initPromise = null;
    throw error;
  });

  return initPromise;
}

/** In the mock, the user is always already logged in. */
export function isLiffLoggedIn(): boolean {
  const runtime = typeof window !== "undefined" ? window.liff ?? null : null;
  return runtime?.isLoggedIn?.() ?? shouldUseMockLiff();
}

/** Pretend to start the LINE login flow. No-op in the mock. */
export async function loginWithLine(): Promise<void> {
  const runtime = typeof window !== "undefined" ? window.liff ?? null : null;

  if (runtime?.login) {
    await runtime.login();
    return;
  }

  if (!shouldUseMockLiff()) {
    throw new Error("LIFF login is unavailable because the SDK is missing.");
  }

  console.info("[mock-liff] loginWithLine()");
  await wait(undefined, 150);
}

/** Read the LINE idToken/accessToken pair. */
export async function getLiffTokens(): Promise<{
  idToken: string;
  accessToken: string;
}> {
  const runtime = typeof window !== "undefined" ? window.liff ?? null : null;

  if (runtime?.getIDToken && runtime?.getAccessToken) {
    const idToken = runtime.getIDToken();
    const accessToken = runtime.getAccessToken();

    if (!idToken || !accessToken) {
      throw new Error("LINE tokens are not available.");
    }

    return { idToken, accessToken };
  }

  if (!shouldUseMockLiff()) {
    throw new Error("LIFF tokens are unavailable because the SDK is missing.");
  }

  const profile = await getLiffProfile();
  const suffix = profile.lineUserId.replace(/\s+/g, "-").toLowerCase();

  return wait({
    idToken: `mock-id-token-${suffix}`,
    accessToken: `mock-access-token-${suffix}`,
  });
}

/** Return the mock LINE profile. */
export async function getLiffProfile(): Promise<LiffProfile> {
  const runtime = typeof window !== "undefined" ? window.liff ?? null : null;

  if (runtime?.getProfile) {
    const profile = await runtime.getProfile();
    return {
      displayName: profile.displayName,
      lineUserId: profile.userId,
      pictureUrl: profile.pictureUrl ?? "",
    };
  }

  if (!shouldUseMockLiff()) {
    throw new Error("LIFF profile is unavailable because the SDK is missing.");
  }

  return wait(mockCustomerProfile);
}

/** Open an external URL. Falls back to window.open in the browser mock. */
export function openExternalWindow(url: string, external = true): void {
  const runtime = typeof window !== "undefined" ? window.liff ?? null : null;

  if (runtime?.openWindow) {
    runtime.openWindow({ url, external });
    return;
  }

  if (!shouldUseMockLiff()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  console.info(`[mock-liff] openExternalWindow(${url}, external=${external})`);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Pretend to close the LIFF window. No-op in the browser mock. */
export function closeLiffWindow(): void {
  const runtime = typeof window !== "undefined" ? window.liff ?? null : null;

  if (runtime?.closeWindow) {
    runtime.closeWindow();
    return;
  }

  if (!shouldUseMockLiff()) return;

  console.info("[mock-liff] closeLiffWindow()");
}
