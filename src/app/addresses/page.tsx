"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  Home,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  initialAddresses,
  loadSavedAddresses,
  saveAddresses,
  type SavedAddress,
} from "@/lib/address-storage";
import { cn } from "@/lib/utils";

const emptyAddress: Omit<SavedAddress, "id" | "isDefault"> = {
  label: "",
  customerName: "",
  phone: "",
  address: "",
  note: "",
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [storageReady, setStorageReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAddresses(loadSavedAddresses());
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveAddresses(addresses);
  }, [addresses, storageReady]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyAddress);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (address: SavedAddress) => {
    setEditingId(address.id);
    setForm({
      label: address.label,
      customerName: address.customerName,
      phone: address.phone,
      address: address.address,
      note: address.note,
    });
    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setErrors({});
  };

  const saveAddress = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.label.trim()) nextErrors.label = "กรุณาระบุชื่อที่อยู่";
    if (!form.customerName.trim()) nextErrors.customerName = "กรุณาระบุชื่อผู้รับ";
    if (!form.phone.trim()) nextErrors.phone = "กรุณาระบุเบอร์โทรศัพท์";
    if (!form.address.trim()) nextErrors.address = "กรุณาระบุที่อยู่จัดส่ง";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (editingId) {
      setAddresses((items) =>
        items.map((item) =>
          item.id === editingId ? { ...item, ...form } : item
        )
      );
    } else {
      setAddresses((items) => [
        ...items,
        {
          ...form,
          id: `address-${Date.now()}`,
          isDefault: items.length === 0,
        },
      ]);
    }
    closeForm();
  };

  const setDefaultAddress = (id: string) => {
    setAddresses((items) =>
      items.map((item) => ({ ...item, isDefault: item.id === id }))
    );
  };

  const removeAddress = (id: string) => {
    setAddresses((items) => items.filter((item) => item.id !== id));
  };

  return (
    <>
      <AppHeader
        title="ที่อยู่จัดส่ง"
        showBack
        showCart={false}
        showNotifications={false}
      />
      <PageContainer className="space-y-3 pt-4 pb-44">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-lg font-extrabold text-ink">ที่อยู่ของฉัน</h1>
            <p className="text-xs font-semibold text-ink-soft">
              เลือกที่อยู่ค่าเริ่มต้นสำหรับการสั่งซื้อ
            </p>
          </div>
          <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-extrabold text-brand">
            {addresses.length} ที่อยู่
          </span>
        </div>

        {addresses.map((address) => {
          const Icon = address.label.includes("งาน") ? Building2 : Home;
          return (
            <Card
              key={address.id}
              className={cn(
                "overflow-hidden p-4 transition",
                address.isDefault && "ring-2 ring-brand/35"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    address.isDefault
                      ? "bg-brand text-white"
                      : "bg-brand-soft text-brand"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-extrabold text-ink">
                      {address.label}
                    </h2>
                    {address.isDefault && (
                      <span className="rounded-full bg-brand-soft px-2 py-1 text-[10px] font-extrabold text-brand">
                        ค่าเริ่มต้น
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-bold text-ink">
                    {address.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {address.phone}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                    {address.address}
                  </p>
                  {address.note && (
                    <p className="mt-2 rounded-xl bg-[#fff8f6] px-3 py-2 text-[11px] font-semibold text-ink-soft">
                      หมายเหตุ: {address.note}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-black/[0.05] pt-3">
                <div className="flex items-center justify-between gap-3">
                  {!address.isDefault ? (
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-ink">
                        ใช้ที่อยู่นี้เป็นหลัก
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-ink-soft">
                        ระบบจะเลือกให้อัตโนมัติตอนสั่งซื้อ
                      </p>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-extrabold text-success">
                      <Check className="h-4 w-4" />
                      ที่อยู่หลักสำหรับสั่งซื้อ
                    </span>
                  )}

                  <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    aria-label={`แก้ไข ${address.label}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-surface-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => removeAddress(address.id)}
                      aria-label={`ลบ ${address.label}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-brand-soft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  </div>
                </div>

                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefaultAddress(address.id)}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-soft text-xs font-extrabold text-brand ring-1 ring-brand/10 transition active:scale-[0.98]"
                  >
                    <MapPin className="h-4 w-4" />
                    เลือกเป็นที่อยู่หลัก
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </PageContainer>

      <div className="promo-action-bar fixed inset-x-0 bottom-above-nav z-30 mx-auto max-w-md border-t border-brand/10 bg-white/95 px-4 pb-4 pt-3 backdrop-blur-xl md:max-w-3xl md:px-6">
        <Button size="lg" fullWidth onClick={openCreate}>
          <Plus className="h-5 w-5" />
          เพิ่มที่อยู่ใหม่
        </Button>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[86dvh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="flex shrink-0 items-center justify-between border-b border-black/[0.05] px-4 py-3">
              <div>
                <h2 className="text-base font-extrabold text-ink">
                  {editingId ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
                </h2>
                <p className="text-xs font-semibold text-ink-soft">
                  กรอกข้อมูลผู้รับและสถานที่จัดส่ง
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label="ปิดแบบฟอร์มที่อยู่"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <Input
                id="address-label"
                label="ชื่อที่อยู่"
                placeholder="เช่น บ้าน, ที่ทำงาน"
                value={form.label}
                onChange={(event) =>
                  setForm((value) => ({ ...value, label: event.target.value }))
                }
              />
              {errors.label && (
                <p className="-mt-2 text-xs text-brand">{errors.label}</p>
              )}

              <Input
                id="recipient-name"
                label="ชื่อผู้รับ"
                value={form.customerName}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    customerName: event.target.value,
                  }))
                }
              />
              {errors.customerName && (
                <p className="-mt-2 text-xs text-brand">
                  {errors.customerName}
                </p>
              )}

              <Input
                id="recipient-phone"
                label="เบอร์โทรศัพท์"
                inputMode="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm((value) => ({ ...value, phone: event.target.value }))
                }
              />
              {errors.phone && (
                <p className="-mt-2 text-xs text-brand">{errors.phone}</p>
              )}

              <Textarea
                id="shipping-address"
                label="ที่อยู่จัดส่ง"
                rows={4}
                value={form.address}
                onChange={(event) =>
                  setForm((value) => ({
                    ...value,
                    address: event.target.value,
                  }))
                }
              />
              {errors.address && (
                <p className="-mt-2 text-xs text-brand">{errors.address}</p>
              )}

              <Textarea
                id="address-note"
                label="หมายเหตุ (ไม่บังคับ)"
                rows={2}
                placeholder="เช่น ฝากไว้ที่ รปภ."
                value={form.note}
                onChange={(event) =>
                  setForm((value) => ({ ...value, note: event.target.value }))
                }
              />
            </div>

            <div className="shrink-0 border-t border-black/[0.05] p-4">
              <Button fullWidth onClick={saveAddress}>
                บันทึกที่อยู่
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
