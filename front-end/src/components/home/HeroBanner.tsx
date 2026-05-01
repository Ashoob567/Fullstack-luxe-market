"use client";

import * as React from "react";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
// ---------------------------------------------------------------------------
// Slide data
// ---------------------------------------------------------------------------
const slides = [
  {
    id: "watches",
    bg: "#2C2416",
    // swap this src for a real product photo; placeholder kept for dev
    imageSrc: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1400&q=80",
    gradientFrom: "#2C2416",
    headline: "Timeless\nElegance",
    subtext: "Crafted for those who live with precision.",
    ctaLabel: "Shop Watches",
    ctaHref: "/category/watches",
    ctaTextColor: "#2C2416",
  },
  {
    id: "undergarments",
    bg: "#3D1829",
    imageSrc: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1400&q=80",
    gradientFrom: "#3D1829",
    headline: "Comfort\nMeets Style",
    subtext: "Luxurious comfort for every moment.",
    ctaLabel: "Shop Essentials",
    ctaHref: "/category/undergarments",
    ctaTextColor: "#3D1829",
  },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function HeroBanner() {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  // Native autoplay — scrollNext every 4 s
  React.useEffect(() => {
    if (!api) return;
    const timer = setInterval(() => api.scrollNext(), 4000);
    return () => clearInterval(timer);
  }, [api]);

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <section
      aria-label="Featured collections"
      className="w-full min-h-[520px] md:min-h-[640px] relative select-none"
    >
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="w-full h-full"
      >
        <CarouselContent className="h-full m-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="p-0 h-full">
              {/* Slide shell */}
              <div
                className="relative overflow-hidden w-full min-h-[520px] md:min-h-[640px] flex items-end"
                style={{ backgroundColor: slide.bg }}
              >
                {/* Product photograph */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.imageSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  draggable={false}
                />

                {/* Gradient overlay — covers left 60%, fades right */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, ${slide.gradientFrom}CC 0%, ${slide.gradientFrom}66 45%, transparent 75%)`,
                  }}
                />

                {/* Subtle bottom vignette for text legibility */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, ${slide.gradientFrom}99 0%, transparent 40%)`,
                  }}
                />

                {/* Copy block — bottom-1/3, left-aligned */}
                <div className="absolute bottom-1/3 left-12 md:left-20 z-10 max-w-sm md:max-w-md">
                  {/* Eyebrow rule */}
                  <span
                    className="block mb-4 text-xs tracking-[0.25em] uppercase"
                    style={{ color: "#B5A98A" }}
                  >
                    Luxe Market
                  </span>

                  {/* Headline */}
                  <h2
                    className="font-serif font-bold text-4xl md:text-6xl leading-tight whitespace-pre-line"
                    style={{ color: "#F5F0E8" }}
                  >
                    {slide.headline}
                  </h2>

                  {/* Sub-text */}
                  <p
                    className="text-sm mt-3 mb-8"
                    style={{ color: "#B5A98A" }}
                  >
                    {slide.subtext}
                  </p>

                  {/* CTA */}
                  <Button
                    
                    className="rounded-md px-8 py-3 font-medium text-sm transition-colors duration-200 hover:bg-white"
                    style={{
                      backgroundColor: "#F5F0E8",
                      color: slide.ctaTextColor,
                      border: "none",
                    }}
                  >
                    <Link href={slide.ctaHref}>{slide.ctaLabel}</Link>
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* ----------------------------------------------------------------
            Prev / Next arrows — bottom-right, circle, frosted glass
        ---------------------------------------------------------------- */}
        <div className="absolute bottom-8 right-8 md:right-12 z-20 flex items-center gap-2">
          {/* Dot indicators */}
          <div className="flex gap-1.5 mr-3" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className="transition-all duration-300"
                style={{
                  width: i === current ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  backgroundColor:
                    i === current
                      ? "#F5F0E8"
                      : "rgba(245,240,232,0.35)",
                  border: "none",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>

          {/* Prev */}
          <button
            aria-label="Previous slide"
            onClick={() => api?.scrollPrev()}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#F5F0E8",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.30)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.18)";
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Next */}
          <button
            aria-label="Next slide"
            onClick={() => api?.scrollNext()}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#F5F0E8",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.30)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.18)";
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </Carousel>
    </section>
  );
}