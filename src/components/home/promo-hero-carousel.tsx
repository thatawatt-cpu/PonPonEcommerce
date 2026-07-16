"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiHomeSlide } from "@/types/api";

const OVERLAY =
  "bg-[linear-gradient(90deg,rgba(176,0,6,0.96)_0%,rgba(206,4,10,0.83)_38%,rgba(206,4,10,0.16)_62%,transparent_82%)]";

interface Props {
  slides: ApiHomeSlide[];
}

export function PromoHeroCarousel({ slides }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (
      slides.length <= 1 ||
      paused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="promo-hero-shell relative z-10 rounded-[1.35rem] bg-white">
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
      style={{ aspectRatio: "16 / 9", minHeight: 0 }}
      className="promo-hero relative overflow-hidden rounded-[1.35rem] bg-white text-white"
    >
      {slides.map((slide, index) => (
        <article
          key={slide.id}
          aria-hidden={activeIndex !== index}
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-out",
            activeIndex === index
              ? "z-10 translate-x-0 opacity-100"
              : "pointer-events-none z-0 translate-x-6 opacity-0"
          )}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 960px, 1152px"
            className="object-cover object-center"
          />
          <div className={cn("absolute inset-0", OVERLAY)} />
          <div
            className="promo-hero-content relative z-10 flex max-w-[62%] flex-col items-start justify-center p-5"
            style={{ height: "100%", minHeight: 0 }}
          >
            {slide.badge && (
              <span className="promo-hero-badge rounded-md bg-white px-2 py-0.5 text-[11px] font-extrabold text-brand">
                {slide.badge}
              </span>
            )}
            <h1 className="promo-hero-title mt-2 text-[1.7rem] font-extrabold leading-[1.08] tracking-tight">
              {slide.title}
            </h1>
            {slide.description && (
              <p className="promo-hero-description mt-2 text-xs font-medium text-white/85">
                {slide.description}
              </p>
            )}
            <Link
              href={slide.linkUrl}
              tabIndex={activeIndex === index ? 0 : -1}
              className="promo-hero-cta mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/80 bg-white px-5 text-sm font-extrabold text-brand shadow-[0_8px_18px_rgba(83,0,3,0.2),inset_0_-2px_0_rgba(237,23,28,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_11px_22px_rgba(83,0,3,0.24)] active:translate-y-0.5 active:scale-[0.98]"
            >
              ดูเพิ่มเติม
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/15 px-2.5 py-1.5 backdrop-blur-sm">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
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
      )}
    </section>
    </div>
  );
}
