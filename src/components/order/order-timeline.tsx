import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderTimelineStep } from "@/types/order";

/**
 * Vertical status timeline.
 * completed = green, active = brand red, pending = gray.
 */
export function OrderTimeline({ steps }: { steps: OrderTimelineStep[] }) {
  return (
    <ol className="relative">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const dotColor =
          step.state === "completed"
            ? "bg-success text-white"
            : step.state === "active"
              ? "bg-brand text-white ring-4 ring-brand/15"
              : "bg-surface-muted text-ink-soft";
        const lineColor =
          step.state === "completed" ? "bg-success" : "bg-black/10";
        const labelColor =
          step.state === "pending" ? "text-ink-soft" : "text-ink";

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  dotColor
                )}
              >
                {step.state === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </span>
              {!isLast && <span className={cn("w-0.5 flex-1", lineColor)} />}
            </div>
            <div className={cn("pb-6", isLast && "pb-0")}>
              <p className={cn("text-sm font-semibold", labelColor)}>
                {step.label}
              </p>
              {step.at && (
                <p className="mt-0.5 text-xs text-ink-soft">{step.at}</p>
              )}
              {step.state === "active" && (
                <p className="mt-0.5 text-xs font-medium text-brand">
                  สถานะปัจจุบัน
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
