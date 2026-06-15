import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card bg-surface shadow-[0_10px_30px_rgba(65,25,25,0.07)] ring-1 ring-black/[0.04]",
        className
      )}
      {...props}
    />
  );
}
