import { cn } from "@/lib/utils";
import { formatBaht } from "@/lib/format";

interface PriceProps {
  value: number;
  compareAt?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

export function Price({ value, compareAt, className, size = "md" }: PriceProps) {
  const hasDiscount = compareAt !== undefined && compareAt > value;
  return (
    <span className={cn("flex items-baseline gap-1.5", className)}>
      <span className={cn("font-bold text-brand", sizeClasses[size])}>
        {formatBaht(value)}
      </span>
      {hasDiscount && (
        <span className="text-xs font-medium text-ink-soft line-through">
          {formatBaht(compareAt)}
        </span>
      )}
    </span>
  );
}
