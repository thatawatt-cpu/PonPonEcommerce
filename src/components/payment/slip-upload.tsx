"use client";

import { useRef, useState } from "react";
import { UploadCloud, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlipUploadProps {
  /** Notifies the parent whether a slip image has been selected. */
  onChange?: (hasSlip: boolean) => void;
}

export function SlipUpload({ onChange }: SlipUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setFileName(file.name);
    onChange?.(true);
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    onChange?.(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-black/10 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="ตัวอย่างสลิปการโอนเงิน"
            className="max-h-72 w-full object-contain"
          />
          <button
            type="button"
            onClick={clear}
            aria-label="ลบรูปสลิป"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 border-t border-black/5 px-3 py-2 text-xs text-ink-soft">
            <ImageIcon className="h-4 w-4" />
            <span className="truncate">{fileName}</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/30 bg-brand-soft/50 px-4 py-8 text-center"
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand">
            <UploadCloud className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold text-ink">
            อัปโหลดสลิปการโอนเงิน
          </span>
          <span className="text-xs text-ink-soft">
            แตะเพื่อเลือกรูปภาพจากเครื่อง
          </span>
        </button>
      )}
    </div>
  );
}
