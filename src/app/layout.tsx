import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { SHOP_NAME, SHOP_TAGLINE } from "@/lib/constants";

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: `${SHOP_NAME} Store — ${SHOP_TAGLINE}`,
  description: "ร้าน Pon Pon — ช้อปง่าย สั่งไว ผ่าน LINE",
};

export const viewport: Viewport = {
  themeColor: "#ef3e42",
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
    <html lang="th" className={`${notoThai.variable} h-full`}>
      <body className="min-h-full bg-surface-muted">
        {/*
          Mobile-first shell. Pages set their own column width via PageContainer
          (max-w-md on phones, widening to max-w-3xl on tablet/desktop) so the
          app also looks at home in LINE on iPad and on a PC browser.
        */}
        <div className="relative min-h-dvh w-full bg-surface-muted">
          {children}
        </div>
        <BottomNavigation />
      </body>
    </html>
  );
}
