"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Store,
  ShoppingCart,
  PackageSearch,
  User,
  type LucideIcon,
} from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should also mark this tab active. */
  match?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "หน้าหลัก", icon: Home },
  { href: "/products", label: "สินค้า", icon: Store },
  { href: "/cart", label: "ตะกร้า", icon: ShoppingCart },
  { href: "/orders", label: "ออเดอร์", icon: PackageSearch, match: ["/orders", "/order"] },
  { href: "/profile", label: "โปรไฟล์", icon: User },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/") return pathname === "/";
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function BottomNavigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const rawCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );
  const count = mounted ? rawCount : 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 pt-2 backdrop-blur pb-safe">
      <ul className="mx-auto flex max-w-md items-stretch justify-around md:max-w-3xl md:px-6">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          const isCart = item.href === "/cart";
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-90 motion-reduce:active:scale-100",
                  active ? "text-brand" : "text-ink-soft"
                )}
              >
                <span className="relative">
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-transform duration-200",
                      active && "-translate-y-0.5 scale-110"
                    )}
                    strokeWidth={active ? 2.4 : 2}
                  />
                  {isCart && count > 0 && (
                    <span
                      key={count}
                      className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] animate-pop items-center justify-center rounded-full bg-brand px-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white"
                    >
                      {count}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
