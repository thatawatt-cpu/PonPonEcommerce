import { cn } from "@/lib/utils";

interface PonPonLogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/**
 * Pon Pon brand mark: a friendly red circle with white "PP" lettering.
 * Pure CSS/SVG so it works without a real logo asset.
 */
export function PonPonLogo({
  size = 40,
  withWordmark = false,
  className,
}: PonPonLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="relative inline-flex shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm shadow-brand/30"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <span
          className="font-extrabold tracking-tight"
          style={{ fontSize: size * 0.42 }}
        >
          PP
        </span>
      </span>
      {withWordmark && (
        <span className="text-lg font-extrabold leading-none text-ink">
          Pon<span className="text-brand">Pon</span>
        </span>
      )}
    </span>
  );
}
