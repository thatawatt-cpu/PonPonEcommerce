"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import { PonPonLogo } from "@/components/brand/ponpon-logo";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  /** Show a back button instead of the full logo. */
  showBack?: boolean;
  showCart?: boolean;
  className?: string;
}

export function AppHeader({
  title,
  showBack = false,
  showCart = true,
  className,
}: AppHeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const rawCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );
  const count = mounted ? rawCount : 0;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4 md:max-w-3xl md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {showBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="ย้อนกลับ"
              className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-surface-muted"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : (
            <Link href="/" aria-label="หน้าหลัก Pon Pon">
              <PonPonLogo size={34} withWordmark />
            </Link>
          )}
          {title && (
            <h1 className="truncate text-base font-bold text-ink">{title}</h1>
          )}
        </div>

        {showCart && (
          <Link
            href="/cart"
            aria-label="ตะกร้าสินค้า"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition active:scale-90 hover:bg-surface-muted motion-reduce:active:scale-100"
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
    </header>
  );
}
