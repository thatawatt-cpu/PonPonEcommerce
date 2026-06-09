import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card bg-surface shadow-sm shadow-black/5 ring-1 ring-black/5",
        className
      )}
      {...props}
    />
  );
}
