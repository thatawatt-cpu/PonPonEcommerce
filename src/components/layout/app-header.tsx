"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  Menu,
  ReceiptText,
  ShoppingCart,
  TicketPercent,
  UserRound,
  X,
} from "lucide-react";
import { useCartHydrated, useCartStore } from "@/store/cart-store";
import { SHOP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  /** Show a back button instead of the full logo. */
  showBack?: boolean;
  showCart?: boolean;
  showNotifications?: boolean;
  className?: string;
}

export function AppHeader({
  title,
  showBack = false,
  showCart = true,
  showNotifications = true,
  className,
}: AppHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const hydrated = useCartHydrated();
  const rawCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );
  const count = hydrated ? rawCount : 0;

  const menuItems = [
    { href: "/", label: "หน้าหลัก", icon: Home },
    { href: "/products", label: "สินค้าทั้งหมด", icon: LayoutGrid },
    { href: "/cart", label: "ตะกร้าสินค้า", icon: ShoppingCart },
    { href: "/coupons", label: "คูปองของฉัน", icon: TicketPercent },
    { href: "/orders", label: "ออเดอร์ของฉัน", icon: ReceiptText },
    { href: "/profile", label: "โปรไฟล์", icon: UserRound },
  ];
  const notifications = [
    {
      title: "กำลังตรวจสอบการชำระเงิน ORD001",
      time: "5 นาทีที่แล้ว",
      href: "/orders/ORD001",
    },
    {
      title: "คูปองใหม่พร้อมใช้",
      time: "1 ชม. ที่แล้ว",
      href: "/coupons",
    },
    {
      title: "Flash Sale เริ่มแล้ว",
      time: "วันนี้ 09:00",
      href: "/products",
    },
  ];

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 border-b border-brand/10 bg-white",
          className
        )}
      >
        <div className="relative mx-auto flex h-14 w-full max-w-md items-center justify-between px-3.5 md:max-w-5xl md:px-8 xl:max-w-6xl">
          <div className="flex min-w-0 items-center">
            {showBack ? (
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="ย้อนกลับ"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-brand-soft"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="เปิดเมนู"
                aria-expanded={menuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition active:scale-90 hover:bg-brand-soft"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
          </div>

          <Link
            href="/"
            className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-center text-[15px] font-extrabold text-brand"
          >
            {title || SHOP_NAME}
          </Link>

          <div className="flex items-center gap-0.5">
            {showNotifications && (
              <button
                type="button"
                onClick={() => setNotificationsOpen((value) => !value)}
                aria-label="การแจ้งเตือน"
                aria-expanded={notificationsOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition active:scale-90 hover:bg-brand-soft motion-reduce:active:scale-100"
              >
                <Bell className="h-5.5 w-5.5" />
                {!notificationsRead && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 animate-pop items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    2
                  </span>
                )}
              </button>
            )}

            {showCart && (
              <Link
                href="/cart"
                aria-label="ตะกร้าสินค้า"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition active:scale-90 hover:bg-brand-soft motion-reduce:active:scale-100"
              >
                <ShoppingCart className="h-6 w-6" />
                {count > 0 && (
                  <span
                    key={count}
                    className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-white"
                  >
                    {count}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>

      {notificationsOpen && showNotifications && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="ปิดการแจ้งเตือน"
            onClick={() => setNotificationsOpen(false)}
            className="absolute inset-0 bg-black/20"
          />
          <section className="absolute right-3.5 top-16 w-[calc(100%-28px)] max-w-sm overflow-hidden rounded-3xl bg-white shadow-[0_18px_55px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.05] md:right-[max(1.5rem,calc((100vw-48rem)/2+1.5rem))]">
            <div className="flex items-center justify-between border-b border-black/[0.05] px-4 py-3">
              <div>
                <h2 className="text-sm font-extrabold text-ink">
                  การแจ้งเตือน
                </h2>
                <p className="text-[10px] font-semibold text-ink-soft">
                  {!notificationsRead ? "มี 2 รายการที่ยังไม่ได้อ่าน" : "อ่านครบแล้ว"}
                </p>
              </div>
              {!notificationsRead && (
                <button
                  type="button"
                  onClick={() => setNotificationsRead(true)}
                  className="flex items-center gap-1 text-[11px] font-extrabold text-brand"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  อ่านทั้งหมด
                </button>
              )}
            </div>

            <ul className="divide-y divide-black/[0.05]">
              {notifications.map((notification, index) => {
                const unread = !notificationsRead && index < 2;
                return (
                  <li key={notification.title}>
                    <Link
                      href={notification.href}
                      onClick={() => setNotificationsOpen(false)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition active:bg-brand-soft",
                        unread && "bg-brand-soft/40"
                      )}
                    >
                      <span className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
                        <Bell className="h-4.5 w-4.5" />
                        {unread && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-extrabold text-ink">
                          {notification.title}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold text-ink-soft">
                          {notification.time}
                        </span>
                      </span>
                      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-ink-soft" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/notifications"
              onClick={() => setNotificationsOpen(false)}
              className="block bg-[#fff8f6] px-4 py-3 text-center text-xs font-extrabold text-brand"
            >
              ดูการแจ้งเตือนทั้งหมด
            </Link>
          </section>
        </div>
      )}

      {menuOpen && !showBack && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
          />
          <aside className="relative flex h-full w-[82%] max-w-xs flex-col bg-white px-4 pb-6 pt-4 shadow-[18px_0_50px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-4">
              <div>
                <p className="text-lg font-extrabold text-brand">{SHOP_NAME}</p>
                <p className="text-xs font-semibold text-ink-soft">
                  เลือกหน้าที่ต้องการ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="ปิดเมนู"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-4 space-y-2">
              {menuItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold text-ink transition hover:bg-brand-soft hover:text-brand active:scale-[0.98]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">{label}</span>
                  {href === "/cart" && count > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                      {count}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
