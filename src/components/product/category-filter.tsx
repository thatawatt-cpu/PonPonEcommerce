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
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
      {categories.map((cat) => {
        const active = cat.id === selected;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 motion-reduce:active:scale-100",
              active
                ? "bg-brand text-white"
                : "bg-white text-ink-soft ring-1 ring-black/10"
            )}
          >
            <span>{cat.emoji}</span>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
