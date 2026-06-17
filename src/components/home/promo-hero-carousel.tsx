"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isLineWebView } from "@/lib/webview";

const slides = [
  {
    badge: "SALE",
    title: "โปรเด็ดวันนี้",
    highlight: "ลดสูงสุด 50%",
    description: "ราคาพิเศษเฉพาะวันนี้",
    href: "/products",
    cta: "ช้อปเลย",
    imageUrl: "/images/promo-hero.png",
    imagePosition: "object-center",
    overlay:
      "bg-[linear-gradient(90deg,rgba(176,0,6,0.96)_0%,rgba(206,4,10,0.83)_38%,rgba(206,4,10,0.08)_72%)]",
  },
  {
    badge: "FLASH SALE",
    title: "ช่วงเวลาพิเศษ",
    highlight: "ดีลแรง จำนวนจำกัด",
    description: "รีบเลือกก่อนสินค้าหมด",
    href: "/products?sort=sale",
    cta: "ดูดีล",
    imageUrl: "/images/products/cookies.png",
    imagePosition: "object-right",
    overlay:
      "bg-[linear-gradient(90deg,rgba(151,0,5,0.98)_0%,rgba(218,13,19,0.9)_48%,rgba(237,23,28,0.18)_100%)]",
  },
  {
    badge: "GIFT",
    title: "ส่งความสุข",
    highlight: "ของขวัญจาก PonPon",
    description: "แพ็กสวย พร้อมส่งถึงคนพิเศษ",
    href: "/products?category=gift",
    cta: "เลือกของขวัญ",
    imageUrl: "/images/products/teddy.png",
    imagePosition: "object-right",
    overlay:
      "bg-[linear-gradient(90deg,rgba(111,0,4,0.97)_0%,rgba(190,9,14,0.86)_46%,rgba(237,23,28,0.12)_100%)]",
  },
];

export function PromoHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (
      paused ||
      isLineWebView() ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [paused]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="โปรโมชัน"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      className="relative min-h-56 overflow-hidden rounded-[1.35rem] bg-brand text-white shadow-[0_16px_36px_rgba(190,9,14,0.28)] md:min-h-72"
    >
      {slides.map((slide, index) => (
        <article
          key={slide.title}
          aria-hidden={activeIndex !== index}
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-out",
            activeIndex === index
              ? "z-10 translate-x-0 opacity-100"
              : "pointer-events-none z-0 translate-x-6 opacity-0"
          )}
        >
          <Image
            src={slide.imageUrl}
            alt=""
            fill
            priority={index === 0}
            sizes="(max-width: 768px) 100vw, 768px"
            className={cn("object-cover", slide.imagePosition)}
          />
          <div className={cn("absolute inset-0", slide.overlay)} />
          <div className="relative z-10 flex min-h-56 max-w-[62%] flex-col items-start justify-center p-5 md:min-h-72 md:max-w-[58%] md:p-8">
            <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-extrabold text-brand">
              {slide.badge}
            </span>
            <h1 className="mt-2 text-[1.7rem] font-extrabold leading-[1.08] tracking-tight md:text-4xl">
              {slide.title}
              <br />
              {slide.highlight}
            </h1>
            <p className="mt-2 text-xs font-medium text-white/85 md:text-sm">
              {slide.description}
            </p>
            <Link
              href={slide.href}
              tabIndex={activeIndex === index ? 0 : -1}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/80 bg-white px-5 text-sm font-extrabold text-brand shadow-[0_8px_18px_rgba(83,0,3,0.2),inset_0_-2px_0_rgba(237,23,28,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_11px_22px_rgba(83,0,3,0.24)] active:translate-y-0.5 active:scale-[0.98]"
            >
              {slide.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      ))}

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/15 px-2.5 py-1.5 backdrop-blur-sm">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`ดูโปรโมชัน ${index + 1}`}
            aria-current={activeIndex === index ? "true" : undefined}
            className={cn(
              "h-1.5 rounded-full bg-white/55 transition-all",
              activeIndex === index ? "w-5 bg-white" : "w-1.5"
            )}
          />
        ))}
      </div>
    </section>
  );
}
