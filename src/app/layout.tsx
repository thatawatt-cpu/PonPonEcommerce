import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { LiffAuthBootstrap } from "@/components/layout/liff-auth-bootstrap";
import { SHOP_NAME, SHOP_TAGLINE } from "@/lib/constants";
import { getAppOrigin } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getAppOrigin()),
  title: `${SHOP_NAME} â€” ${SHOP_TAGLINE}`,
  description: "à¸£à¹‰à¸²à¸™ Pon Pon â€” à¸Šà¹‰à¸­à¸›à¸‡à¹ˆà¸²à¸¢ à¸ªà¸±à¹ˆà¸‡à¹„à¸§ à¸œà¹ˆà¸²à¸™ LINE",
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
    <html lang="th" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-surface-muted" suppressHydrationWarning>
        <Script
          id="line-webview-performance-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var ua = navigator.userAgent || "";
                  if (/Line\\//i.test(ua) || /LIFF/i.test(ua)) {
                    document.documentElement.classList.add("line-webview");
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
        <Script
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          strategy="afterInteractive"
        />
        {/*
          Mobile-first shell. Pages set their own column width while shared
          chrome widens on tablet/desktop so the app feels balanced on iPad
          and in a PC browser.
        */}
        <div className="relative min-h-dvh w-full">
          <LiffAuthBootstrap />
          {children}
        </div>
        <BottomNavigation />
      </body>
    </html>
  );
}
