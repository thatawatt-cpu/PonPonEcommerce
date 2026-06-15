"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  Home,
  LayoutGrid,
  ReceiptText,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useCartHydrated, useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should also mark this tab active. */
  match?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Shop", icon: Home },
  { href: "/products", label: "Products", icon: LayoutGrid },
  { href: "/cart", label: "Cart", icon: Heart },
  {
    href: "/orders",
    label: "Orders",
    icon: ReceiptText,
    match: ["/orders", "/order"],
  },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/") return pathname === "/";
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function BottomNavigation() {
  const pathname = usePathname();
  const hydrated = useCartHydrated();
  const rawCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );
  const count = hydrated ? rawCount : 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-brand/10 bg-white/95 pt-1.5 backdrop-blur-xl pb-safe">
      <ul className="mx-auto flex max-w-md items-stretch justify-around md:max-w-3xl md:px-6">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          const isCart = item.href === "/cart";
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "flex h-15 flex-col items-center justify-center text-[10px] font-bold transition active:scale-90 motion-reduce:active:scale-100",
                  active ? "gap-0 text-brand" : "text-ink"
                )}
              >
                <span className="relative">
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-transform duration-200",
                      active && "scale-105"
                    )}
                    fill={active && item.href === "/" ? "currentColor" : "none"}
                    strokeWidth={active ? 2.5 : 2.2}
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
                {active && <span className="leading-3">{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
