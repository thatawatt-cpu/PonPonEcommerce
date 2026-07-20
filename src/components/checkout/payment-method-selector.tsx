"use client";

import Image from "next/image";
import { Check, CreditCard, Landmark, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types/order";
import type { ApiMobileBankingType } from "@/types/api";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  bankType: ApiMobileBankingType;
  onBankTypeChange: (value: ApiMobileBankingType) => void;
}

const BANK_ACCOUNTS = [
  {
    id: "mobile_banking_kbank",
    name: "กสิกรไทย",
    suffix: "K PLUS",
    logoSrc: "/images/banks/kbank.png",
  },
  {
    id: "mobile_banking_scb",
    name: "ไทยพาณิชย์",
    suffix: "SCB EASY",
    logoSrc: "/images/banks/scb.png",
  },
  {
    id: "mobile_banking_bbl",
    name: "กรุงเทพ",
    suffix: "Bualuang",
    logoSrc: "/images/banks/bangkok-bank.png",
  },
  {
    id: "mobile_banking_ktb",
    name: "กรุงไทย",
    suffix: "NEXT",
    logoSrc: "/images/banks/ktb.svg",
  },
  {
    id: "mobile_banking_bay",
    name: "กรุงศรี",
    suffix: "KMA",
    logoSrc: "/images/banks/krungsri.svg",
  },
] satisfies {
  id: ApiMobileBankingType;
  name: string;
  suffix: string;
  logoSrc: string | null;
}[];

const PAYMENT_OPTIONS = [
  {
    id: "promptpay",
    title: "QR พร้อมเพย์",
    description: "สแกนจ่ายผ่านแอปธนาคาร",
    badge: "แนะนำ",
    icon: QrCode,
    iconClassName: "bg-brand-soft text-brand",
  },
  {
    id: "mobile_banking",
    title: "โมบายแบงก์กิ้ง",
    description: "ยืนยันผ่านแอปธนาคาร",
    icon: Landmark,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    id: "credit_card",
    title: "บัตรเครดิต / เดบิต",
    description: "Visa และ Mastercard",
    icon: CreditCard,
    iconClassName: "bg-violet-50 text-violet-600",
  },
] satisfies {
  id: PaymentMethod;
  title: string;
  description: string;
  badge?: string;
  icon: typeof QrCode;
  iconClassName: string;
}[];

export function PaymentMethodSelector({
  value,
  onChange,
  bankType,
  onBankTypeChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {PAYMENT_OPTIONS.map((option) => {
          const active = value === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={cn(
                "relative flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition duration-150 active:scale-[0.99] sm:min-h-32 sm:flex-col sm:items-start",
                active
                  ? "border-brand bg-brand-soft/55 shadow-[0_8px_24px_rgba(237,23,28,0.1)]"
                  : "border-black/[0.08] bg-white hover:border-brand/30"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  option.iconClassName
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-extrabold text-ink">
                    {option.title}
                  </span>
                  {option.badge && (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-extrabold text-white">
                      {option.badge}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-relaxed text-ink-soft">
                  {option.description}
                </span>
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border sm:absolute sm:right-3 sm:top-3",
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-black/20 bg-white"
                )}
              >
                {active && <Check className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
      </div>

      {value === "mobile_banking" && (
        <div className="animate-fade-in rounded-2xl border border-blue-100 bg-blue-50/45 p-3">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold text-ink">
              เลือกแอปธนาคาร
            </p>
            <p className="text-[10px] font-semibold text-ink-soft">
              ระบบจะพาไปยืนยันในแอป
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BANK_ACCOUNTS.map((bank) => {
              const active = bankType === bank.id;

              return (
                <button
                  key={bank.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onBankTypeChange(bank.id)}
                  className={cn(
                    "flex min-h-16 items-center gap-2 rounded-xl border bg-white p-2.5 text-left transition active:scale-[0.98]",
                    active
                      ? "border-blue-500 ring-2 ring-blue-100"
                      : "border-black/[0.07]"
                  )}
                >
                  <span className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white px-1 ring-1 ring-black/10">
                    {bank.logoSrc ? (
                      <Image
                        src={bank.logoSrc}
                        alt=""
                        width={48}
                        height={40}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[9px] font-extrabold text-ink-soft">
                        {bank.suffix}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-extrabold text-ink">
                      {bank.name}
                    </span>
                    <span className="block truncate text-[9px] font-semibold text-ink-soft">
                      {bank.suffix}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
