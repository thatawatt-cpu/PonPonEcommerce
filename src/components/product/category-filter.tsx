"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/types/common";

interface CategoryFilterProps {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="no-scrollbar -mx-3.5 flex gap-2 overflow-x-auto px-3.5 py-2">
      {categories.map((cat) => {
        const active = cat.id === selected;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              "relative flex min-h-10 shrink-0 items-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-sm font-bold transition duration-200 active:translate-y-0.5 active:scale-[0.98] motion-reduce:active:scale-100",
              active
                ? "brand-button border-white/25 text-white"
                : "border-black/[0.07] bg-[linear-gradient(180deg,#fff_0%,#fff_55%,#f8f4f2_100%)] text-ink-soft shadow-[inset_0_1px_0_#fff,0_5px_12px_rgba(72,35,35,0.1)] hover:-translate-y-0.5 hover:border-brand/15 hover:text-brand hover:shadow-[inset_0_1px_0_#fff,0_8px_16px_rgba(72,35,35,0.13)]"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                active
                  ? "bg-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
                  : "bg-brand-soft/70"
              )}
            >
              {cat.emoji}
            </span>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
