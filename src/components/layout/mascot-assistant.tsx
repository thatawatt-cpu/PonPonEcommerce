"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Grip, X } from "lucide-react";
import { cn } from "@/lib/utils";

const POSITION_KEY = "ponpon-mascot-position";
const HIDDEN_KEY = "ponpon-mascot-hidden";

interface MascotPosition {
  x: number;
  y: number;
}

export function MascotAssistant() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [position, setPosition] = useState<MascotPosition | null>(null);
  const positionRef = useRef<MascotPosition | null>(null);
  const dragStart = useRef<{
    pointerX: number;
    pointerY: number;
    elementX: number;
    elementY: number;
  } | null>(null);
  const dragged = useRef(false);
  const pathname = usePathname();
  const hasStickyAction =
    pathname.startsWith("/products/") || pathname === "/checkout";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedPosition = window.localStorage.getItem(POSITION_KEY);
      const savedHidden = window.localStorage.getItem(HIDDEN_KEY);

      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition) as MascotPosition;
          if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
            positionRef.current = parsed;
            setPosition(parsed);
          }
        } catch {
          window.localStorage.removeItem(POSITION_KEY);
        }
      }
      setHidden(savedHidden === "true");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const clampPosition = (x: number, y: number): MascotPosition => {
    const size = 64;
    const bottomClearance = hasStickyAction ? 184 : 80;
    return {
      x: Math.min(Math.max(x, 8), window.innerWidth - size - 8),
      y: Math.min(
        Math.max(y, 64),
        window.innerHeight - size - bottomClearance,
      ),
    };
  };

  const savePosition = (next: MascotPosition) => {
    positionRef.current = next;
    setPosition(next);
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(next));
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      elementX: rect.left,
      elementY: rect.top,
    };
    dragged.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!dragStart.current) return;
    const deltaX = event.clientX - dragStart.current.pointerX;
    const deltaY = event.clientY - dragStart.current.pointerY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) {
      dragged.current = true;
      setOpen(false);
    }
    if (!dragged.current) return;

    const nextPosition = clampPosition(
      dragStart.current.elementX + deltaX,
      dragStart.current.elementY + deltaY,
    );
    positionRef.current = nextPosition;
    setPosition(nextPosition);
  };

  const handlePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (positionRef.current && dragged.current) {
      savePosition(positionRef.current);
    }
    dragStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const hideMascot = () => {
    setOpen(false);
    setHidden(true);
    window.localStorage.setItem(HIDDEN_KEY, "true");
  };

  const showMascot = () => {
    setHidden(false);
    window.localStorage.setItem(HIDDEN_KEY, "false");
  };

  if (hidden) {
    return (
      <button
        type="button"
        onClick={showMascot}
        className="fixed bottom-[5.25rem] left-0 z-30 flex h-10 items-center gap-1 rounded-r-full bg-white px-2.5 text-[10px] font-extrabold text-brand shadow-[0_7px_20px_rgba(65,25,25,0.16)] ring-1 ring-brand/10 transition hover:bg-brand-soft"
      >
        <Image
          src="/images/mascot/ponpon-mascot-web.webp"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
        เรียกป๋องป๋อง
      </button>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-3 z-30 md:left-[max(1rem,calc(50%-23rem))]",
        position && "!bottom-auto",
        hasStickyAction ? "bottom-[12rem]" : "bottom-[5.25rem]",
      )}
      style={position ? { left: position.x, top: position.y } : undefined}
    >
      <div
        className={cn(
          "absolute bottom-16 left-3 w-56 origin-bottom-left rounded-3xl border border-brand/10 bg-white p-3.5 shadow-[0_14px_34px_rgba(65,25,25,0.16)] transition duration-200",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="ปิดผู้ช่วย PonPon"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-ink-soft transition hover:bg-brand-soft hover:text-brand"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <p className="pr-7 text-sm font-extrabold text-ink">
          สวัสดี เราชื่อป๋องป๋อง
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          ให้ช่วยเลือกของอร่อย หรือหาดีลเด็ดให้ไหม?
        </p>
        <Link
          href="/products"
          onClick={() => setOpen(false)}
          className="brand-button mt-3 flex h-9 items-center justify-center gap-1 rounded-full px-4 text-xs font-extrabold text-white"
        >
          ไปเลือกสินค้า
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
        <span className="absolute -bottom-2 left-5 h-4 w-4 rotate-45 border-b border-r border-brand/10 bg-white" />
      </div>

      <button
        type="button"
        onClick={() => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          setOpen((current) => !current);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
        aria-label={open ? "ปิดผู้ช่วย PonPon" : "เปิดผู้ช่วย PonPon"}
        aria-expanded={open}
        className="group relative flex h-16 w-16 touch-none cursor-grab items-end justify-center rounded-full bg-white shadow-[0_10px_26px_rgba(65,25,25,0.2)] ring-1 ring-brand/15 transition hover:shadow-[0_14px_30px_rgba(190,9,14,0.22)] active:cursor-grabbing active:scale-95"
      >
        <Image
          src="/images/mascot/ponpon-mascot-web.webp"
          alt=""
          width={64}
          height={64}
          className="h-[4.7rem] w-[4.7rem] max-w-none object-contain transition duration-200 group-hover:scale-105"
          priority={false}
        />
        <span className="absolute -right-1 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-extrabold text-white ring-2 ring-white">
          Hi
        </span>
        <span className="absolute bottom-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-ink-soft shadow-sm ring-1 ring-black/5">
          <Grip className="h-3 w-3" />
        </span>
      </button>
      <button
        type="button"
        onClick={hideMascot}
        aria-label="ซ่อน Mascot ป๋องป๋อง"
        className="absolute -left-1 -top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-soft shadow-md ring-1 ring-black/5 transition hover:bg-brand hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </aside>
  );
}
