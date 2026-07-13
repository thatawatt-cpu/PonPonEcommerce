"use client";

import {
  PONPON_AUTH_EXCHANGE_URL,
  PONPON_AUTH_REFRESH_URL,
} from "@/lib/auth-config";
import { parseApiTime } from "@/lib/date-time";
import type { PonPonMeResponse } from "@/types/customer";

const JWT_STORAGE_KEY = "ponpon.auth.jwt";
const LINE_ACCESS_TOKEN_KEY = "ponpon.auth.line.accessToken";
const LINE_REFRESH_TOKEN_KEY = "ponpon.auth.line.refreshToken";
export const PONPON_AUTH_TOKEN_CHANGED_EVENT = "ponpon-auth-token-changed";

export interface PonPonAuthExchangeResponse {
  accessToken?: string;
  AccessToken?: string;
  refreshToken?: string;
  RefreshToken?: string;
  customer?: {
    id?: string;
    lineUserId?: string;
    displayName?: string;
    pictureUrl?: string | null;
    email?: string | null;
  };
  jwt?: string;
  token?: string;
  expiresIn?: number;
  expiresAt?: string | number;
  [key: string]: unknown;
}

export interface PonPonSession {
  jwt: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface PonPonMeSession {
  id: string;
  userType: string;
  displayName: string;
  email: string | null;
  pictureUrl: string | null;
  roles: string[];
  wishlistCount: number;
  couponCount: number;
  recentlyViewedCount: number;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

let refreshSessionPromise: Promise<PonPonSession> | null = null;

export function getStoredPonPonJwt(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(JWT_STORAGE_KEY);
}

export function setStoredPonPonJwt(jwt: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(JWT_STORAGE_KEY, jwt);
  window.dispatchEvent(new Event(PONPON_AUTH_TOKEN_CHANGED_EVENT));
}

export function clearStoredPonPonJwt(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(JWT_STORAGE_KEY);
  window.dispatchEvent(new Event(PONPON_AUTH_TOKEN_CHANGED_EVENT));
}

export function clearStoredPonPonSession(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(JWT_STORAGE_KEY);
  window.localStorage.removeItem(LINE_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(LINE_REFRESH_TOKEN_KEY);
  window.dispatchEvent(new Event(PONPON_AUTH_TOKEN_CHANGED_EVENT));
}

export function isStoredJwtValid(): boolean {
  const jwt = getStoredPonPonJwt();
  if (!jwt) return false;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1]));
    if (typeof payload.exp !== "number") return true; // no expiry = treat as valid
    return Date.now() < (payload.exp - 60) * 1000; // 60s buffer
  } catch {
    return false;
  }
}

export function getStoredLineAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(LINE_ACCESS_TOKEN_KEY);
}

export function setStoredLineAccessToken(accessToken: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LINE_ACCESS_TOKEN_KEY, accessToken);
}

export function clearStoredLineAccessToken(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(LINE_ACCESS_TOKEN_KEY);
}

export function getStoredLineRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(LINE_REFRESH_TOKEN_KEY);
}

export function setStoredLineRefreshToken(refreshToken: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LINE_REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredLineRefreshToken(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(LINE_REFRESH_TOKEN_KEY);
}

export function buildPonPonAuthHeaders(
  headers: HeadersInit = {}
): Headers {
  const nextHeaders = new Headers(headers);
  const jwt = getStoredPonPonJwt();

  if (jwt && !nextHeaders.has("Authorization")) {
    nextHeaders.set("Authorization", `Bearer ${jwt}`);
  }

  return nextHeaders;
}

function buildSessionFromPayload(
  payload: PonPonAuthExchangeResponse | null
): PonPonSession {
  const appAccessToken =
    payload && typeof payload.accessToken === "string"
      ? payload.accessToken
      : payload && typeof payload.AccessToken === "string"
        ? payload.AccessToken
        : "";

  const refreshToken =
    payload && typeof payload.refreshToken === "string"
      ? payload.refreshToken
      : payload && typeof payload.RefreshToken === "string"
        ? payload.RefreshToken
        : "";

  const jwt =
    appAccessToken ||
    (payload && typeof payload.jwt === "string"
      ? payload.jwt
      : payload && typeof payload.token === "string"
        ? payload.token
        : "");

  if (!jwt) {
    throw new Error("PonPon auth backend did not return an access token.");
  }

  setStoredPonPonJwt(jwt);
  if (refreshToken) {
    setStoredLineRefreshToken(refreshToken);
  }

  const expiresAt =
    payload && typeof payload.expiresIn === "number"
      ? Date.now() + payload.expiresIn * 1000
      : payload && typeof payload.expiresAt === "number"
        ? payload.expiresAt
        : payload && typeof payload.expiresAt === "string"
          ? parseApiTime(payload.expiresAt, { utc: true })
          : undefined;

  return {
    jwt,
    accessToken: jwt,
    refreshToken: refreshToken || undefined,
    expiresAt:
      typeof expiresAt === "number" && Number.isFinite(expiresAt)
        ? expiresAt
        : undefined,
  };
}

export async function refreshPonPonSession(): Promise<PonPonSession> {
  if (refreshSessionPromise) return refreshSessionPromise;

  const refreshToken = getStoredLineRefreshToken();
  if (!refreshToken) {
    clearStoredPonPonSession();
    throw new Error("PonPon refresh token is not available.");
  }

  refreshSessionPromise = (async () => {
    try {
      console.info("[ponpon-auth] refresh request", {
        endpoint: PONPON_AUTH_REFRESH_URL,
      });

      const response = await fetch(PONPON_AUTH_REFRESH_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      console.info("[ponpon-auth] refresh response", {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        clearStoredPonPonSession();
        const errBody = (await response.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        const detail = errBody
          ? (errBody.error ??
            errBody.message ??
            errBody.title ??
            JSON.stringify(errBody))
          : null;
        throw new Error(
          `PonPon auth refresh failed with status ${response.status}${detail ? `: ${detail}` : ""}`
        );
      }

      const payload = (await response.json().catch(() => null)) as
        | PonPonAuthExchangeResponse
        | null;

      return buildSessionFromPayload(payload);
    } catch (error) {
      clearStoredPonPonSession();
      throw error;
    }
  })().finally(() => {
    refreshSessionPromise = null;
  });

  return refreshSessionPromise;
}

export async function ponponFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const requestInit: RequestInit = {
    ...init,
    credentials: init.credentials ?? "include",
    headers: buildPonPonAuthHeaders(init.headers),
  };

  const response = await fetch(input, requestInit);

  if (response.status !== 401) {
    return response;
  }

  try {
    await refreshPonPonSession();
  } catch (error) {
    console.warn("[ponpon-auth] refresh failed after 401", error);
    return response;
  }

  const retryInit: RequestInit = {
    ...init,
    credentials: init.credentials ?? "include",
    headers: buildPonPonAuthHeaders(init.headers),
  };

  const retryResponse = await fetch(input, retryInit);

  if (retryResponse.status === 401) {
    clearStoredPonPonSession();
  }

  return retryResponse;
}

export async function fetchPonPonMe(): Promise<Response> {
  return ponponFetch("/api/auth/me", {
    method: "GET",
  });
}

export async function getPonPonMe(): Promise<PonPonMeSession> {
  const response = await fetchPonPonMe();

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredPonPonSession();
    }

    throw new Error(`PonPon me request failed with status ${response.status}`);
  }

  const data = (await response.json().catch(() => null)) as
    | PonPonMeResponse
    | null;

  if (!data?.id || !data?.displayName) {
    throw new Error("PonPon me response is missing required fields.");
  }

  return {
    id: data.id,
    userType: data.userType,
    displayName: data.displayName,
    email: data.email,
    pictureUrl: data.pictureUrl ?? null,
    roles: data.roles ?? [],
    wishlistCount:
      typeof data.wishlistCount === "number" ? data.wishlistCount : 0,
    couponCount: typeof data.couponCount === "number" ? data.couponCount : 0,
    recentlyViewedCount:
      typeof data.recentlyViewedCount === "number"
        ? data.recentlyViewedCount
        : 0,
  };
}

export async function exchangeLineIdToken(input: {
  idToken: string;
  accessToken?: string;
  endpoint?: string;
}): Promise<PonPonSession> {
  const endpoint = input.endpoint ?? PONPON_AUTH_EXCHANGE_URL;

  if (input.accessToken) {
    setStoredLineAccessToken(input.accessToken);
  }

  console.info("[ponpon-auth] exchange request", { endpoint });

  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      idToken: input.idToken,
    }),
  });

  console.info("[ponpon-auth] exchange response", {
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => null) as Record<string, unknown> | null;
    const detail = errBody
      ? (errBody.error ?? errBody.message ?? errBody.title ?? JSON.stringify(errBody))
      : null;
    console.error("[ponpon-auth] exchange error body", errBody);
    throw new Error(
      `PonPon auth exchange failed with status ${response.status}${detail ? `: ${detail}` : ""}`
    );
  }

  const payload =
    (await response.json().catch(() => null)) as
      | PonPonAuthExchangeResponse
      | null;

  return buildSessionFromPayload(payload);
}
