import type { NextConfig } from "next";

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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
    ],
  },
};

export default nextConfig;
