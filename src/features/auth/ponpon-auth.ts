"use client";

import { PONPON_AUTH_EXCHANGE_URL } from "@/lib/auth-config";
import type { PonPonMeResponse } from "@/types/customer";

const JWT_STORAGE_KEY = "ponpon.auth.jwt";
const LINE_ACCESS_TOKEN_KEY = "ponpon.auth.line.accessToken";
const LINE_REFRESH_TOKEN_KEY = "ponpon.auth.line.refreshToken";

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
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredPonPonJwt(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(JWT_STORAGE_KEY);
}

export function setStoredPonPonJwt(jwt: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(JWT_STORAGE_KEY, jwt);
}

export function clearStoredPonPonJwt(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(JWT_STORAGE_KEY);
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

export async function ponponFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: init.credentials ?? "include",
    headers: buildPonPonAuthHeaders(init.headers),
  });
}

export async function fetchPonPonMe(): Promise<Response> {
  return ponponFetch("/api/auth/me", {
    method: "GET",
  });
}

export async function getPonPonMe(): Promise<PonPonMeSession> {
  const response = await fetchPonPonMe();

  if (!response.ok) {
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
    throw new Error(
      `PonPon auth exchange failed with status ${response.status}`
    );
  }

  const payload =
    (await response.json().catch(() => null)) as
      | PonPonAuthExchangeResponse
      | null;

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

  return {
    jwt,
    accessToken: jwt,
    refreshToken: refreshToken || undefined,
    expiresAt:
      payload && typeof payload.expiresIn === "number"
        ? Date.now() + payload.expiresIn * 1000
        : undefined,
  };
}
