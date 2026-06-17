export const PONPON_LIFF_ID =
  process.env.NEXT_PUBLIC_LIFF_ID?.trim() || "MOCK_LIFF_ID";

export const PONPON_AUTH_EXCHANGE_URL =
  process.env.NEXT_PUBLIC_PONPON_AUTH_EXCHANGE_URL?.trim() ||
  "/api/auth/line-login";

export const PONPON_SKIP_LINE_LIFF =
  process.env.NEXT_PUBLIC_SKIP_LINE_LIFF?.trim().toLowerCase() === "true";
