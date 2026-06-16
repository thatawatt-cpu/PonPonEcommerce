import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { SHOP_NAME, SHOP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SHOP_NAME} — ${SHOP_TAGLINE}`,
  description: "ร้าน Pon Pon — ช้อปง่าย สั่งไว ผ่าน LINE",
};

export const viewport: Viewport = {
  themeColor: "#ed171c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full bg-surface-muted">
        {/*
          Mobile-first shell. Pages set their own column width via PageContainer
          (max-w-md on phones, widening to max-w-3xl on tablet/desktop) so the
          app also looks at home in LINE on iPad and on a PC browser.
        */}
        <div className="relative min-h-dvh w-full">
          {children}
        </div>
        <BottomNavigation />
      </body>
    </html>
  );
}
