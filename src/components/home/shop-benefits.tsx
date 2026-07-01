import {
  BadgeCheck,
  MessageCircle,
  PackageCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

const benefits: { label: string; detail: string; icon: LucideIcon }[] = [
  { label: "ส่งฟรี", detail: "ครบ ฿399", icon: Truck },
  { label: "ของแท้", detail: "รับประกัน", icon: BadgeCheck },
  { label: "แพ็กดี", detail: "ส่งไว", icon: PackageCheck },
  { label: "ช่วยเหลือ", detail: "ผ่าน LINE", icon: MessageCircle },
];

export function ShopBenefits() {
  return (
    <section className="home-panel-shadow mt-4 rounded-card bg-white px-2 py-3">
      <div className="grid grid-cols-4 divide-x divide-black/[0.05]">
        {benefits.map(({ label, detail, icon: Icon }) => (
          <div key={label} className="flex min-w-0 flex-col items-center px-1 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
            </span>
            <span className="mt-1.5 text-[11px] font-extrabold text-ink">
              {label}
            </span>
            <span className="text-[9px] font-medium text-ink-soft">
              {detail}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
