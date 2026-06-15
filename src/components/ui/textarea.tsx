import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    const textarea = (
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-2xl border border-black/[0.07] bg-surface-muted/70 px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 outline-none transition focus:border-brand focus:bg-white focus:ring-3 focus:ring-brand/10",
          className
        )}
        {...props}
      />
    );

    if (!label) return textarea;
    return (
      <label htmlFor={id} className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </span>
        {textarea}
      </label>
    );
  }
);

Textarea.displayName = "Textarea";
