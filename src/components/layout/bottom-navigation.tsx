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
import {
  useFavoriteStore,
  useFavoritesHydrated,
} from "@/store/favorite-store";
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
  { href: "/favorites", label: "สินค้าที่ถูกใจ", icon: Heart },
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
  const hydrated = useFavoritesHydrated();
  const rawCount = useFavoriteStore((s) => s.productIds.length);
  const count = hydrated ? rawCount : 0;

  if (pathname.startsWith("/payment")) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-brand/10 bg-white pt-1.5 pb-safe">
      <ul className="mx-auto flex w-full max-w-md items-stretch justify-around md:max-w-5xl md:px-8 xl:max-w-6xl">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          const isFavorites = item.href === "/favorites";
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
                    fill={
                      active && (item.href === "/" || isFavorites)
                        ? "currentColor"
                        : "none"
                    }
                    strokeWidth={active ? 2.5 : 2.2}
                  />
                  {isFavorites && count > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] animate-pop items-center justify-center rounded-full bg-brand px-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                      {count}
                    </span>
                  )}
                </span>
                {active && (
                  <span className="max-w-full truncate leading-3">
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
