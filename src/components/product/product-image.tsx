import { cn } from "@/lib/utils";

interface ProductImageProps {
  emoji: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const emojiSize = {
  sm: "text-3xl",
  md: "text-5xl",
  lg: "text-7xl",
};

/**
 * Friendly placeholder visual for a product. No real product photos exist in
 * the mock, so we render the product's emoji on a soft brand-tinted gradient.
 */
export function ProductImage({
  emoji,
  className,
  size = "md",
}: ProductImageProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-brand-soft to-brand-tint",
        className
      )}
      aria-hidden
    >
      <span className={emojiSize[size]}>{emoji}</span>
    </div>
  );
}
