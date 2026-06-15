import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Add bottom padding so content clears the fixed bottom navigation. */
  withBottomNav?: boolean;
}

/** Centered mobile-first column with optional bottom-nav clearance. */
export function PageContainer({
  children,
  className,
  withBottomNav = true,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md animate-fade-in px-3.5 md:max-w-3xl md:px-6",
        withBottomNav && "pb-28",
        className
      )}
    >
      {children}
    </div>
  );
}
