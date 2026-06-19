import "server-only";

export const PONPON_BACKEND_BASE_URL = (
  process.env.PONPON_BACKEND_BASE_URL?.trim() ||
  process.env.PONPON_AUTH_BACKEND_BASE_URL?.trim() ||
  "http://localhost:3001"
).replace(/\/+$/, "");
