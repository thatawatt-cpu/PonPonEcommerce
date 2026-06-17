import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  imageUrl?: string;
  emoji: string;
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
  fit?: "cover" | "contain";
}

const emojiSize = {
  sm: "text-3xl",
  md: "text-5xl",
  lg: "text-7xl",
};

export function ProductImage({
  imageUrl,
  emoji,
  className,
  priority = false,
  size = "md",
  fit = "cover",
}: ProductImageProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-[#fbf7f2]",
        className
      )}
      aria-hidden
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={
            size === "lg"
              ? "(min-width: 768px) 384px, 100vw"
              : size === "sm"
                ? "80px"
                : "(min-width: 768px) 200px, 45vw"
          }
          priority={priority}
          className={cn(
            "transition-transform duration-300",
            fit === "contain" ? "object-contain" : "object-cover"
          )}
        />
      ) : (
        <span className={emojiSize[size]}>{emoji}</span>
      )}
    </div>
  );
}
