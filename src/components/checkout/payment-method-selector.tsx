"use client";

import { QrCode, Truck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type { PaymentMethod } from "@/types/order";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

const OPTIONS: { value: PaymentMethod; icon: typeof QrCode; hint: string }[] = [
  { value: "promptpay", icon: QrCode, hint: "สแกน QR แล้วแนบสลิป" },
  { value: "cod", icon: Truck, hint: "จ่ายเงินสดเมื่อรับสินค้า" },
];

export function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-2.5">
      {OPTIONS.map(({ value: method, icon: Icon, hint }) => {
        const active = value === method;
        return (
          <button
            key={method}
            type="button"
            onClick={() => onChange(method)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
              active
                ? "border-brand bg-brand-soft shadow-sm"
                : "border-black/[0.07] bg-white"
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                active ? "bg-brand text-white" : "bg-surface-muted text-ink-soft"
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-ink">
                {PAYMENT_METHOD_LABEL[method]}
              </span>
              <span className="block text-xs text-ink-soft">{hint}</span>
            </span>
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border",
                active ? "border-brand bg-brand text-white" : "border-black/20"
              )}
            >
              {active && <Check className="h-3.5 w-3.5" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
