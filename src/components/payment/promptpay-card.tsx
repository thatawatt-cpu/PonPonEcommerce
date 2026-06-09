"use client";

import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PAYMENT_ACCOUNT } from "@/lib/constants";
import { formatBaht } from "@/lib/format";

/** Mock PromptPay QR + bank account details. */
export function PromptPayCard({ amount }: { amount: number }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (label: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const rows: { label: string; value: string }[] = [
    { label: "ธนาคาร", value: PAYMENT_ACCOUNT.bankName },
    { label: "เลขบัญชี", value: PAYMENT_ACCOUNT.accountNumber },
    { label: "ชื่อบัญชี", value: PAYMENT_ACCOUNT.accountName },
  ];

  return (
    <Card className="p-5">
      <div className="flex flex-col items-center text-center">
        <p className="text-sm font-medium text-ink-soft">ยอดที่ต้องชำระ</p>
        <p className="mt-0.5 text-3xl font-extrabold text-brand">
          {formatBaht(amount)}
        </p>

        {/* Mock QR code — a decorative placeholder, not a scannable code. */}
        <div className="mt-4 rounded-2xl border-2 border-brand/20 bg-white p-4">
          <div className="grid h-44 w-44 place-items-center rounded-xl bg-gradient-to-br from-surface-muted to-brand-soft">
            <QrCode className="h-24 w-24 text-brand" strokeWidth={1.2} />
          </div>
          <p className="mt-2 text-xs font-semibold text-ink-soft">
            PromptPay (มอคอัพ)
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-xs text-ink-soft">{row.label}</p>
              <p className="truncate text-sm font-semibold text-ink">
                {row.value}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copy(row.label, row.value)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-xs font-medium text-brand ring-1 ring-brand/20"
            >
              {copied === row.label ? (
                <>
                  <Check className="h-3.5 w-3.5" /> คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> คัดลอก
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
