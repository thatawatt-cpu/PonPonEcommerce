import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "app-panel-shadow rounded-card bg-surface ring-1 ring-black/[0.04]",
        className
      )}
      {...props}
    />
  );
}
