"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SelectHTMLAttributes,
} from "react";
import {
  Bell,
  Building2,
  Check,
  Edit3,
  Heart,
  Home,
  Loader2,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  fetchCustomerAddresses,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from "@/features/customer-addresses/customer-address-api";
import {
  clearSelectedAddressId,
  createAddressPayload,
  getSelectedAddressId,
  setSelectedAddressId,
  toSavedAddress,
  type AddressFormState,
  type CustomerAddress,
  type SavedAddress,
} from "@/lib/address-storage";
import { cn } from "@/lib/utils";

const emptyAddress: AddressFormState = {
  label: "",
  recipientName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  subdistrict: "",
  district: "",
  province: "",
  postcode: "",
  country: "TH",
  isDefault: false,
};

interface SubdistrictOption {
  name: string;
  postcode: string;
}

type AddressOptionsLoading = {
  provinces: boolean;
  districts: boolean;
  subdistricts: boolean;
};

type AddressOptionRequestIds = {
  provinces: number;
  districts: number;
  subdistricts: number;
};

interface AddressSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  placeholder: string;
  options: string[];
}

function AddressSelect({
  id,
  label,
  placeholder,
  options,
  className,
  ...props
}: AddressSelectProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <select
        id={id}
        className={cn(
          "w-full appearance-none rounded-2xl border border-black/[0.07] bg-surface-muted/70 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-3 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-55",
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

async function fetchAddressOptions<T>(
  params: Record<string, string>,
  signal?: AbortSignal
): Promise<T[]> {
  const query = new URLSearchParams(params);
  const response = await fetch(
    `/api/thai-addresses${query.size ? `?${query}` : ""}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error("โหลดข้อมูลพื้นที่ไม่สำเร็จ");
  }

  const data = (await response.json()) as { items?: T[] };
  return Array.isArray(data.items) ? data.items : [];
}

function preserveAddressOrder(
  nextAddresses: SavedAddress[],
  orderIds?: string[]
) {
  if (!orderIds) return nextAddresses;

  const order = new Map(orderIds.map((id, index) => [id, index]));
  return [...nextAddresses].sort((a, b) => {
    const aIndex = order.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = order.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}

function EmptyAddressIllustration() {
  return (
    <div className="relative mx-auto h-44 w-72 max-w-full">
      <div className="absolute bottom-5 left-8 h-8 w-36 rounded-[999px] bg-brand/10 blur-md" />
      <div className="absolute bottom-7 left-8 h-16 w-20 rounded-lg bg-[#f1b35f] shadow-[inset_0_8px_0_rgba(255,255,255,0.24)]">
        <div className="absolute left-0 top-0 h-5 w-full rounded-t-lg bg-[#ffd38a]" />
        <Package className="absolute left-6 top-6 h-8 w-8 text-[#b8752f]" />
      </div>
      <div className="absolute bottom-4 left-24 h-32 w-28 rounded-b-[1.25rem] rounded-t-lg bg-gradient-to-br from-brand-light to-brand-dark shadow-[0_18px_35px_rgba(237,23,28,0.28)]">
        <div className="absolute left-5 top-0 h-10 w-5 -translate-y-6 rounded-t-full border-4 border-b-0 border-brand-dark bg-transparent" />
        <div className="absolute right-5 top-0 h-10 w-5 -translate-y-6 rounded-t-full border-4 border-b-0 border-brand-dark bg-transparent" />
        <div className="absolute left-1/2 top-9 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-white text-brand">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <p className="absolute bottom-5 left-0 right-0 text-center text-xl font-extrabold text-white">
          PonPon
        </p>
      </div>
      <div className="absolute bottom-7 right-14 flex h-12 w-12 rotate-[-10deg] items-center justify-center rounded-full bg-[#f7b93d] text-white shadow-[inset_0_0_0_5px_rgba(255,255,255,0.32)]">
        <span className="text-xl font-extrabold">฿</span>
      </div>
      <span className="absolute left-14 top-14 text-brand">
        <Heart className="h-7 w-7 fill-current" />
      </span>
      <span className="absolute right-10 top-14 flex h-12 w-14 rotate-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Heart className="h-6 w-6 fill-current" />
      </span>
      <span className="absolute left-8 top-8 h-3 w-3 rotate-45 rounded-sm bg-brand" />
      <span className="absolute right-28 top-5 h-3 w-3 rotate-45 rounded-sm bg-[#f7b93d]" />
      <span className="absolute right-20 top-11 h-2.5 w-2.5 rotate-45 rounded-sm bg-[#ee7d4c]" />
    </div>
  );
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AddressFormState>(emptyAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [provinceOptions, setProvinceOptions] = useState<string[]>([]);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<
    SubdistrictOption[]
  >([]);
  const [addressOptionsLoading, setAddressOptionsLoading] =
    useState<AddressOptionsLoading>({
      provinces: false,
      districts: false,
      subdistricts: false,
    });
  const addressOptionRequestIds = useRef<AddressOptionRequestIds>({
    provinces: 0,
    districts: 0,
    subdistricts: 0,
  });
  const [saving, setSaving] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(
    null
  );
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(
    null
  );
  const [defaultingAddressId, setDefaultingAddressId] = useState<string | null>(
    null
  );
  const [selectedAddressId, setSelectedAddressIdState] = useState<string | null>(
    null
  );

  const syncAddresses = useCallback(
    (
      items: CustomerAddress[],
      preferredAddressId?: string | null,
      orderIds?: string[]
    ) => {
      const nextAddresses = preserveAddressOrder(
        items.map(toSavedAddress),
        orderIds
      );
      const storedSelectedId = getSelectedAddressId();
      const selectedAddress =
        nextAddresses.find((address) => address.id === preferredAddressId) ??
        nextAddresses.find((address) => address.id === storedSelectedId) ??
        nextAddresses.find((address) => address.isDefault) ??
        nextAddresses[0] ??
        null;

      setAddresses(nextAddresses);
      setSelectedAddressIdState(selectedAddress?.id ?? null);

      if (selectedAddress) {
        setSelectedAddressId(selectedAddress.id);
      } else {
        clearSelectedAddressId();
      }
    },
    []
  );

  const loadAddresses = useCallback(
    async (
      preferredAddressId?: string | null,
      options: { showLoading?: boolean; preserveOrderIds?: string[] } = {}
    ) => {
      if (options.showLoading ?? true) {
        setLoading(true);
      }
      setLoadError(null);

      try {
        const items = await fetchCustomerAddresses();
        syncAddresses(items, preferredAddressId, options.preserveOrderIds);
        return items;
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "โหลดที่อยู่ไม่สำเร็จ"
        );
        setAddresses([]);
        setSelectedAddressIdState(null);
        clearSelectedAddressId();
        throw err;
      } finally {
        if (options.showLoading ?? true) {
          setLoading(false);
        }
      }
    },
    [syncAddresses]
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);
      fetchCustomerAddresses()
        .then((items) => {
          if (cancelled) return;
          syncAddresses(items);
        })
        .catch((err) => {
          if (cancelled) return;
          setLoadError(
            err instanceof Error ? err.message : "โหลดที่อยู่ไม่สำเร็จ"
          );
          setAddresses([]);
          setSelectedAddressIdState(null);
          clearSelectedAddressId();
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [syncAddresses]);

  useEffect(() => {
    if (!formOpen || provinceOptions.length > 0) return;
    const controller = new AbortController();
    const requestId = addressOptionRequestIds.current.provinces + 1;
    addressOptionRequestIds.current.provinces = requestId;
    const isLatestRequest = () =>
      addressOptionRequestIds.current.provinces === requestId;
    const timer = window.setTimeout(() => {
      setAddressOptionsLoading((value) => ({ ...value, provinces: true }));
      void fetchAddressOptions<string>({}, controller.signal)
        .then((options) => {
          if (isLatestRequest()) setProvinceOptions(options);
        })
        .catch((optionError: unknown) => {
          if (optionError instanceof Error && optionError.name === "AbortError")
            return;
          if (!isLatestRequest()) return;
          setErrors((value) => ({
            ...value,
            addressOptions: "โหลดรายชื่อจังหวัดไม่สำเร็จ กรุณาลองใหม่",
          }));
        })
        .finally(() => {
          if (isLatestRequest()) {
            setAddressOptionsLoading((value) => ({
              ...value,
              provinces: false,
            }));
          }
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [formOpen, provinceOptions.length]);

  useEffect(() => {
    if (!formOpen || !form.province) {
      return;
    }

    const controller = new AbortController();
    const province = form.province;
    const requestId = addressOptionRequestIds.current.districts + 1;
    addressOptionRequestIds.current.districts = requestId;
    const isLatestRequest = () =>
      addressOptionRequestIds.current.districts === requestId;
    const timer = window.setTimeout(() => {
      setAddressOptionsLoading((value) => ({ ...value, districts: true }));
      void fetchAddressOptions<string>({ province }, controller.signal)
        .then((options) => {
          if (isLatestRequest()) setDistrictOptions(options);
        })
        .catch((optionError: unknown) => {
          if (optionError instanceof Error && optionError.name === "AbortError")
            return;
          if (!isLatestRequest()) return;
          setErrors((value) => ({
            ...value,
            addressOptions: "โหลดรายชื่อเขต/อำเภอไม่สำเร็จ กรุณาลองใหม่",
          }));
        })
        .finally(() => {
          if (isLatestRequest()) {
            setAddressOptionsLoading((value) => ({
              ...value,
              districts: false,
            }));
          }
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.province, formOpen]);

  useEffect(() => {
    if (!formOpen || !form.province || !form.district) {
      return;
    }

    const controller = new AbortController();
    const province = form.province;
    const district = form.district;
    const requestId = addressOptionRequestIds.current.subdistricts + 1;
    addressOptionRequestIds.current.subdistricts = requestId;
    const isLatestRequest = () =>
      addressOptionRequestIds.current.subdistricts === requestId;
    const timer = window.setTimeout(() => {
      setAddressOptionsLoading((value) => ({ ...value, subdistricts: true }));
      void fetchAddressOptions<SubdistrictOption>(
        { province, district },
        controller.signal
      )
        .then((options) => {
          if (isLatestRequest()) setSubdistrictOptions(options);
        })
        .catch((optionError: unknown) => {
          if (optionError instanceof Error && optionError.name === "AbortError")
            return;
          if (!isLatestRequest()) return;
          setErrors((value) => ({
            ...value,
            addressOptions: "โหลดรายชื่อแขวง/ตำบลไม่สำเร็จ กรุณาลองใหม่",
          }));
        })
        .finally(() => {
          if (isLatestRequest()) {
            setAddressOptionsLoading((value) => ({
              ...value,
              subdistricts: false,
            }));
          }
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.district, form.province, formOpen]);

  const openCreate = () => {
    setEditingAddress(null);
    setForm({ ...emptyAddress, isDefault: addresses.length === 0 });
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setForm({
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      email: address.email,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      subdistrict: address.subdistrict,
      district: address.district,
      province: address.province,
      postcode: address.postcode,
      country: address.country || "TH",
      isDefault: address.isDefault,
    });
    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setErrors({});
    setEditingAddress(null);
  };

  const updateForm = (patch: Partial<AddressFormState>) => {
    setForm((value) => ({ ...value, ...patch }));
  };

  const selectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setSelectedAddressIdState(address.id);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.recipientName.trim()) nextErrors.recipientName = "กรุณาระบุชื่อผู้รับ";
    if (!form.phone.trim()) nextErrors.phone = "กรุณาระบุเบอร์โทรศัพท์";
    if (!form.addressLine1.trim()) nextErrors.addressLine1 = "กรุณาระบุที่อยู่";
    if (!form.subdistrict.trim()) nextErrors.subdistrict = "กรุณาระบุแขวง/ตำบล";
    if (!form.district.trim()) nextErrors.district = "กรุณาระบุเขต/อำเภอ";
    if (!form.province.trim()) nextErrors.province = "กรุณาระบุจังหวัด";
    if (!form.postcode.trim()) nextErrors.postcode = "กรุณาระบุรหัสไปรษณีย์";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveAddress = async () => {
    if (!validate() || saving) return;
    setSaving(true);

    try {
      const payload = createAddressPayload(form);
      const saved = editingAddress
        ? await updateCustomerAddress(editingAddress.id, payload)
        : await createCustomerAddress(payload);

      await loadAddresses(saved?.id ?? editingAddress?.id ?? null, {
        showLoading: false,
        preserveOrderIds: editingAddress
          ? addresses.map((address) => address.id)
          : undefined,
      });
      closeForm();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "บันทึกที่อยู่ไม่สำเร็จ",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (address: SavedAddress) => {
    if (deletingAddressId) return;
    const confirmed = window.confirm(
      `ลบที่อยู่ "${address.label || "ที่อยู่"}" ใช่ไหม?`
    );
    if (!confirmed) return;

    setDeletingAddressId(address.id);
    setLoadError(null);

    try {
      await deleteCustomerAddress(address.id);
      await loadAddresses(
        selectedAddressId === address.id ? null : selectedAddressId,
        {
          showLoading: false,
          preserveOrderIds: addresses
            .filter((item) => item.id !== address.id)
            .map((item) => item.id),
        }
      );
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "ลบที่อยู่ไม่สำเร็จ"
      );
    } finally {
      setDeletingAddressId(null);
    }
  };

  const makeDefaultAddress = async (address: SavedAddress) => {
    if (address.isDefault || defaultingAddressId) return;

    setDefaultingAddressId(address.id);
    setLoadError(null);

    try {
      await setDefaultCustomerAddress(address.id);
      await loadAddresses(address.id, {
        showLoading: false,
        preserveOrderIds: addresses.map((item) => item.id),
      });
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "ตั้งที่อยู่หลักไม่สำเร็จ"
      );
    } finally {
      setDefaultingAddressId(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-brand/10 bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex h-16 w-full max-w-md items-center justify-center px-4 md:max-w-5xl md:px-8 xl:max-w-6xl">
          <h1 className="text-xl font-extrabold text-brand">ที่อยู่จัดส่ง</h1>
          <button
            type="button"
            aria-label="การแจ้งเตือน"
            className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full text-ink transition active:scale-95 hover:bg-brand-soft md:right-8"
          >
            <Bell className="h-7 w-7" />
            <span className="absolute right-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1 text-xs font-extrabold text-white ring-2 ring-white">
              2
            </span>
          </button>
        </div>
      </header>

      <PageContainer className="space-y-6 px-5 pb-52 pt-8 md:max-w-5xl md:px-8 xl:max-w-6xl">
        <section className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-brand">
              <MapPin className="h-[3.25rem] w-[3.25rem]" strokeWidth={2.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-ink">ที่อยู่ของฉัน</h2>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                เลือกที่อยู่สำหรับจัดส่งสินค้าและบริการสั่งซื้อ
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-brand/10 bg-brand-soft px-4 py-3 text-sm font-extrabold text-brand">
            <MapPin className="h-5 w-5" />
            {loading ? "..." : `${addresses.length} ที่อยู่`}
          </span>
        </section>

        {loadError && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {loadError}
          </p>
        )}

        {loading ? (
          <Card className="flex min-h-[22rem] items-center justify-center gap-2 rounded-[2rem] bg-white p-6 text-sm font-bold text-ink-soft shadow-[0_18px_50px_rgba(237,23,28,0.12)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            กำลังโหลดที่อยู่
          </Card>
        ) : addresses.length === 0 ? (
          <Card className="rounded-[2rem] bg-white p-5 shadow-[0_18px_50px_rgba(237,23,28,0.12)] md:p-7">
            <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-brand/18 px-5 py-12 text-center">
              <EmptyAddressIllustration />
              <h2 className="mt-4 text-3xl font-extrabold text-ink">
                ยังไม่มีที่อยู่
              </h2>
              <p className="mt-3 max-w-xl text-base font-semibold leading-relaxed text-ink-soft">
                เพิ่มที่อยู่แรกของคุณ เพื่อใช้จัดส่งสินค้าได้สะดวกยิ่งขึ้น
              </p>
              <div className="mt-7 inline-flex max-w-full items-center gap-3 rounded-full border border-brand/10 bg-brand-soft/60 px-5 py-3 text-sm font-extrabold text-ink-soft">
                <ShieldCheck className="h-5 w-5 shrink-0 text-brand-light" />
                <span className="min-w-0">
                  ข้อมูลของคุณจะถูกเก็บเป็นความลับและปลอดภัย
                </span>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {addresses.map((address) => {
              const Icon = address.label.includes("งาน") ? Building2 : Home;
              const selected = selectedAddressId === address.id;
              return (
                <Card
                  key={address.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectAddress(address)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectAddress(address);
                    }
                  }}
                  className={cn(
                    "flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] bg-white p-4 shadow-[0_12px_35px_rgba(237,23,28,0.1)] transition active:scale-[0.99]",
                    selected
                      ? "ring-2 ring-brand"
                      : address.isDefault && "ring-2 ring-brand/25"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                        selected
                          ? "bg-brand text-white"
                          : "bg-brand-soft text-brand"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-extrabold text-ink">
                          {address.label || "ที่อยู่"}
                        </h2>
                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-[10px] font-extrabold text-brand">
                            <Check className="h-3 w-3" />
                            ค่าเริ่มต้น
                          </span>
                        )}
                        {selected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-1 text-[10px] font-extrabold text-white">
                            <Check className="h-3 w-3" />
                            เลือกอยู่
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-bold text-ink">
                        {address.recipientName}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {address.phone}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                        {address.fullAddress}
                      </p>
                      {address.addressLine2 && (
                        <p className="mt-3 rounded-2xl bg-[#fff8f6] px-3 py-2 text-[11px] font-semibold text-ink-soft">
                          รายละเอียดเพิ่มเติม: {address.addressLine2}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        selectAddress(address);
                      }}
                      disabled={selected}
                      className={cn(
                        "flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-extrabold transition active:scale-[0.98]",
                        selected
                          ? "bg-brand text-white"
                          : "bg-brand-soft text-brand ring-1 ring-brand/10"
                      )}
                    >
                      {selected ? (
                        <>
                          <Check className="h-4 w-4" />
                          ใช้ที่อยู่นี้อยู่
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4" />
                          เลือกที่อยู่นี้
                        </>
                      )}
                    </button>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(address);
                        }}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-black/[0.06] bg-white text-xs font-extrabold text-ink transition active:scale-[0.98] hover:border-brand/25"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          makeDefaultAddress(address);
                        }}
                        disabled={
                          address.isDefault ||
                          defaultingAddressId === address.id
                        }
                        className={cn(
                          "flex h-10 items-center justify-center gap-1.5 rounded-full border text-xs font-extrabold transition active:scale-[0.98]",
                          address.isDefault
                            ? "border-brand/10 bg-brand-soft text-brand"
                            : "border-black/[0.06] bg-white text-ink hover:border-brand/25"
                        )}
                      >
                        {defaultingAddressId === address.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Star className="h-3.5 w-3.5" />
                        )}
                        ที่อยู่หลัก
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteAddress(address);
                        }}
                        disabled={deletingAddressId === address.id}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-red-100 bg-red-50 text-xs font-extrabold text-red-600 transition active:scale-[0.98] disabled:opacity-70"
                      >
                        {deletingAddressId === address.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        ลบ
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>

      <div className="fixed inset-x-0 bottom-above-nav z-30 px-5 pb-3 md:px-8">
        <div className="mx-auto max-w-md md:max-w-5xl xl:max-w-6xl">
          <Button
            size="lg"
            fullWidth
            onClick={openCreate}
            className="h-[4.25rem] text-xl font-extrabold shadow-[0_18px_40px_rgba(237,23,28,0.28)] ring-1 ring-white/50"
          >
            <Plus className="h-7 w-7" />
            เพิ่มที่อยู่ใหม่
          </Button>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[86dvh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="flex shrink-0 items-center justify-between border-b border-black/[0.05] px-4 py-3">
              <div>
                <h2 className="text-base font-extrabold text-ink">
                  {editingAddress ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
                </h2>
                <p className="text-xs font-semibold text-ink-soft">
                  {editingAddress
                    ? "ปรับข้อมูลผู้รับและสถานที่จัดส่ง"
                    : "กรอกข้อมูลผู้รับและสถานที่จัดส่ง"}
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
              {errors.form && (
                <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                  {errors.form}
                </p>
              )}
              {errors.addressOptions && (
                <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  {errors.addressOptions}
                </p>
              )}

              <Input
                id="address-label"
                label="ชื่อที่อยู่"
                placeholder="เช่น บ้าน, ที่ทำงาน"
                value={form.label ?? ""}
                onChange={(event) => updateForm({ label: event.target.value })}
              />

              <Input
                id="recipient-name"
                label="ชื่อผู้รับ"
                value={form.recipientName}
                onChange={(event) =>
                  updateForm({ recipientName: event.target.value })
                }
              />
              {errors.recipientName && (
                <p className="-mt-2 text-xs text-brand">
                  {errors.recipientName}
                </p>
              )}

              <Input
                id="recipient-phone"
                label="เบอร์โทรศัพท์"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => updateForm({ phone: event.target.value })}
              />
              {errors.phone && (
                <p className="-mt-2 text-xs text-brand">{errors.phone}</p>
              )}

              <Input
                id="recipient-email"
                label="อีเมล (ไม่บังคับ)"
                type="email"
                value={form.email ?? ""}
                onChange={(event) => updateForm({ email: event.target.value })}
              />

              <Textarea
                id="address-line-1"
                label="ที่อยู่"
                rows={3}
                value={form.addressLine1}
                onChange={(event) =>
                  updateForm({ addressLine1: event.target.value })
                }
              />
              {errors.addressLine1 && (
                <p className="-mt-2 text-xs text-brand">
                  {errors.addressLine1}
                </p>
              )}

              <Input
                id="address-line-2"
                label="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                placeholder="เช่น ส่งที่เคาน์เตอร์ประชาสัมพันธ์"
                value={form.addressLine2 ?? ""}
                onChange={(event) =>
                  updateForm({ addressLine2: event.target.value })
                }
              />

              <AddressSelect
                id="province"
                label="จังหวัด"
                placeholder={
                  addressOptionsLoading.provinces
                    ? "กำลังโหลดจังหวัด..."
                    : "เลือกจังหวัด"
                }
                value={form.province}
                options={provinceOptions}
                disabled={addressOptionsLoading.provinces}
                onChange={(event) => {
                  updateForm({
                    province: event.target.value,
                    district: "",
                    subdistrict: "",
                    postcode: "",
                  });
                  setDistrictOptions([]);
                  setSubdistrictOptions([]);
                  setAddressOptionsLoading((value) => ({
                    ...value,
                    districts: false,
                    subdistricts: false,
                  }));
                }}
              />
              {errors.province && (
                <p className="-mt-2 text-xs text-brand">
                  {errors.province}
                </p>
              )}

              <AddressSelect
                id="district"
                label="เขต/อำเภอ"
                placeholder={
                  addressOptionsLoading.districts
                    ? "กำลังโหลดเขต/อำเภอ..."
                    : form.province
                      ? "เลือกเขต/อำเภอ"
                      : "เลือกจังหวัดก่อน"
                }
                value={form.district}
                options={districtOptions}
                disabled={!form.province || addressOptionsLoading.districts}
                onChange={(event) => {
                  updateForm({
                    district: event.target.value,
                    subdistrict: "",
                    postcode: "",
                  });
                  setSubdistrictOptions([]);
                  setAddressOptionsLoading((value) => ({
                    ...value,
                    subdistricts: false,
                  }));
                }}
              />
              {errors.district && (
                <p className="-mt-2 text-xs text-brand">{errors.district}</p>
              )}

              <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                <AddressSelect
                  id="subdistrict"
                  label="แขวง/ตำบล"
                  placeholder={
                    addressOptionsLoading.subdistricts
                      ? "กำลังโหลด..."
                      : form.district
                        ? "เลือกแขวง/ตำบล"
                        : "เลือกเขต/อำเภอก่อน"
                  }
                  value={form.subdistrict}
                  options={subdistrictOptions.map((option) => option.name)}
                  disabled={!form.district || addressOptionsLoading.subdistricts}
                  onChange={(event) => {
                    const selected = subdistrictOptions.find(
                      (option) => option.name === event.target.value
                    );
                    updateForm({
                      subdistrict: event.target.value,
                      postcode: selected?.postcode ?? "",
                    });
                  }}
                />
                <Input
                  id="postcode"
                  label="รหัสไปรษณีย์"
                  inputMode="numeric"
                  value={form.postcode}
                  readOnly
                  placeholder="อัตโนมัติ"
                  className="bg-black/[0.03] text-center font-bold"
                />
              </div>
              {(errors.subdistrict || errors.postcode) && (
                <p className="-mt-2 text-xs text-brand">
                  {errors.subdistrict || errors.postcode}
                </p>
              )}

              <label className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-surface-muted/40 px-3 py-3 text-sm font-extrabold text-ink">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    updateForm({ isDefault: event.target.checked })
                  }
                  className="h-5 w-5 rounded border-brand/20 accent-brand"
                />
                ตั้งเป็นที่อยู่หลัก
              </label>
            </div>

            <div className="shrink-0 border-t border-black/[0.05] p-4">
              <Button fullWidth onClick={saveAddress} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก
                  </>
                ) : (
                  editingAddress ? "บันทึกการแก้ไข" : "บันทึกที่อยู่"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
