"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: QuantitySelectorProps) {
  const btn =
    size === "sm"
      ? "h-7 w-7"
      : "h-9 w-9";
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-black/10 bg-white",
        className
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="ลดจำนวน"
        className={cn(
          "flex items-center justify-center rounded-full text-ink transition active:scale-90 disabled:opacity-30 disabled:active:scale-100 motion-reduce:active:scale-100",
          btn
        )}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        className={cn(
          "min-w-7 text-center text-sm font-bold text-ink",
          size === "sm" && "min-w-6"
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="เพิ่มจำนวน"
        className={cn(
          "flex items-center justify-center rounded-full text-ink transition active:scale-90 disabled:opacity-30 disabled:active:scale-100 motion-reduce:active:scale-100",
          btn
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
