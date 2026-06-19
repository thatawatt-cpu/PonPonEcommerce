import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Allow server-side fetching to localhost HTTPS APIs with self-signed certs in development
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>(["*.ngrok-free.app"]);
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (!origin) return Array.from(origins);

  try {
    const url = new URL(origin);
    origins.add(url.hostname);
    return Array.from(origins);
  } catch {
    return Array.from(origins);
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  experimental: {
    // Tree-shake lucide-react — imports only icons actually used
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    remotePatterns: [
      { protocol: "https", hostname: "profile.line-scdn.net" },
      { protocol: "https", hostname: "image.zort.co.th" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
