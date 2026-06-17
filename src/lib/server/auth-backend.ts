import "server-only";

const PONPON_AUTH_BACKEND_BASE_URL =
  process.env.PONPON_AUTH_BACKEND_BASE_URL?.trim() ||
  process.env.PONPON_AUTH_BACKEND_URL?.trim()?.replace(
    /\/api\/auth\/line-login\/?$/,
    ""
  ) ||
  "https://e1be-2405-9800-b662-4f07-e8f1-6753-d343-27dd.ngrok-free.app";

export const PONPON_AUTH_BACKEND_URL =
  process.env.PONPON_AUTH_BACKEND_URL?.trim() ||
  `${PONPON_AUTH_BACKEND_BASE_URL.replace(/\/+$/, "")}/api/auth/line-login`;

export const PONPON_AUTH_BACKEND_ME_URL = `${PONPON_AUTH_BACKEND_BASE_URL.replace(
  /\/+$/,
  ""
)}/api/auth/me`;
