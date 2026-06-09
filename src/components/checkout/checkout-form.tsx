"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ShippingInfo } from "@/types/customer";

interface CheckoutFormProps {
  value: ShippingInfo;
  onChange: (value: ShippingInfo) => void;
  errors?: Partial<Record<keyof ShippingInfo, string>>;
}

export function CheckoutForm({ value, onChange, errors }: CheckoutFormProps) {
  const set = (key: keyof ShippingInfo, v: string) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4">
      <div>
        <Input
          id="customerName"
          label="ชื่อผู้รับ"
          placeholder="เช่น สมหญิง ใจดี"
          value={value.customerName}
          onChange={(e) => set("customerName", e.target.value)}
        />
        {errors?.customerName && (
          <p className="mt-1 text-xs text-brand">{errors.customerName}</p>
        )}
      </div>
      <div>
        <Input
          id="phone"
          label="เบอร์โทรศัพท์"
          type="tel"
          inputMode="tel"
          placeholder="08x-xxx-xxxx"
          value={value.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
        {errors?.phone && (
          <p className="mt-1 text-xs text-brand">{errors.phone}</p>
        )}
      </div>
      <div>
        <Textarea
          id="address"
          label="ที่อยู่จัดส่ง"
          rows={3}
          placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
          value={value.address}
          onChange={(e) => set("address", e.target.value)}
        />
        {errors?.address && (
          <p className="mt-1 text-xs text-brand">{errors.address}</p>
        )}
      </div>
      <Textarea
        id="note"
        label="หมายเหตุ (ไม่บังคับ)"
        rows={2}
        placeholder="เช่น ฝากไว้หน้าบ้าน / โทรก่อนส่ง"
        value={value.note ?? ""}
        onChange={(e) => set("note", e.target.value)}
      />
    </div>
  );
}
