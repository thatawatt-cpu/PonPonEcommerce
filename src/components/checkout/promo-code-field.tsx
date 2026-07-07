"use client";

import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";

interface PromoCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: (code: string) => void;
  appliedCode?: string;
  appliedCodes?: string[];
  message?: string;
  error?: boolean;
  applying?: boolean;
}

export function PromoCodeField({
  value,
  onChange,
  onApply,
  onRemove,
  appliedCode,
  appliedCodes,
  message,
  error,
  applying = false,
}: PromoCodeFieldProps) {
  const codes = appliedCodes ?? (appliedCode ? [appliedCode] : []);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-ink-soft">
          กรอกโค้ด หรือเลือกจากคูปองที่มี
        </p>
        <Link
          href="/coupons?returnTo=checkout"
          className="flex shrink-0 items-center gap-0.5 text-xs font-extrabold text-brand"
        >
          เลือกคูปอง
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {codes.length > 0 && (
        <div className="mb-3 space-y-2">
          {codes.map((code) => (
            <div
              key={code}
              className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success-soft px-3 py-2.5"
            >
              <Check className="h-5 w-5 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-success">
                  ใช้โค้ด {code} แล้ว
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(code)}
                aria-label={`ยกเลิกโค้ด ${code}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink-soft shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {codes.length < 2 && (
        <>
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(event) => onChange(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") onApply();
              }}
              placeholder="เช่น SAVE100"
              className="h-11 min-w-0 flex-1 rounded-2xl border border-black/10 bg-[#fffaf8] px-4 text-sm font-bold uppercase text-ink outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
            />
            <button
              type="button"
              onClick={onApply}
              disabled={!value.trim() || applying}
              className="brand-button h-11 shrink-0 rounded-full px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              ใช้โค้ด
            </button>
          </div>
        </>
      )}

      {message && (
        <p
          className={`mt-2 text-xs font-bold ${
            error ? "text-brand" : "text-success"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
