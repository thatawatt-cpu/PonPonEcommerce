import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { ProductBadge } from "@/types/product";

const badgeStyles: Record<ProductBadge, string> = {
  ขายดี: "bg-brand text-white",
  มาใหม่: "bg-amber-400 text-amber-950",
  แนะนำ: "bg-emerald-500 text-white",
  ลดราคา: "bg-brand-soft text-brand ring-1 ring-brand/30",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: ProductBadge;
}

export function Badge({ label, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none",
        badgeStyles[label],
        className
      )}
      {...props}
    >
      {label}
    </span>
  );
}
