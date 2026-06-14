"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Slide data - OPTIMIZED: Reduced animation delays
// ---------------------------------------------------------------------------
const slides = [
  {
    id: "watches",
    bg: "#2C2416",
    // ⚡ Optimized: Smaller size (1200px instead of 1400px) and lower quality (70 instead of 80)
    imageSrc: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=70&fm=webp&fit=crop",
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
    // ⚡ Optimized: Smaller size and lower quality
    imageSrc: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=70&fm=webp&fit=crop",
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
      className="w-full min-h-[480px] md:min-h-[85vh] relative select-none"
    >
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="w-full h-full"
      >
        <CarouselContent className="h-full m-0">
          {slides.map((slide, idx) => (
            <CarouselItem key={slide.id} className="p-0 h-full">
              {/* Slide shell */}
              <div
                className="relative overflow-hidden w-full min-h-[480px] md:min-h-[85vh] flex items-end"
                style={{ backgroundColor: slide.bg }}
              >
                {/* Noise texture overlay for luxury feel */}
                <div
                  className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "128px 128px",
                  }}
                />

                {/* ✅ OPTIMIZED: Next.js Image with priority for first slide */}
                <Image
                  src={slide.imageSrc}
                  alt=""
                  fill
                  priority={idx === 0} // ⚡ Preload first slide image
                  quality={75} // ⚡ Lower quality for faster load
                  sizes="100vw"
                  loading={idx === 0 ? "eager" : "lazy"} // ⚡ Eager load first image
                  className="object-cover object-center"
                  style={{ objectFit: 'cover' }}
                  fetchPriority={idx === 0 ? "high" : "low"} // ⚡ High priority for first image
                  unoptimized // ⚡ Skip Next.js optimization since Unsplash already optimized
                />

                {/* Gradient overlay — covers left 60%, fades right */}
                <div
                  className="absolute inset-0 z-[2]"
                  style={{
                    background: `linear-gradient(to right, ${slide.gradientFrom}E6 0%, ${slide.gradientFrom}99 45%, transparent 75%)`,
                  }}
                />

                {/* Subtle bottom vignette for text legibility */}
                <div
                  className="absolute inset-0 z-[2]"
                  style={{
                    background: `linear-gradient(to top, ${slide.gradientFrom}CC 0%, transparent 50%)`,
                  }}
                />

                {/* Copy block — bottom-1/3, left-aligned */}
                <div className="absolute bottom-1/3 left-10 md:left-20 z-10 max-w-sm md:max-w-lg">
                  {/* Eyebrow - NO ANIMATION for faster LCP */}
                  <span className="block mb-4 text-xs tracking-[0.3em] uppercase text-brand-gold">
                    Luxe Market
                  </span>

                  {/* Gold underline accent - NO ANIMATION for faster LCP */}
                  <div className="mb-4 h-px w-12 bg-brand-gold" />

                  {/* ✅ CRITICAL LCP ELEMENT - NO ANIMATION for instant render */}
                  <h2
                    className="font-bold text-5xl md:text-7xl leading-[1.05] whitespace-pre-line mb-2 text-brand-text-light"
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      textShadow: "0 2px 40px rgba(0,0,0,0.4)",
                    }}
                  >
                    {slide.headline}
                  </h2>

                  {/* Sub-text */}
                  <motion.p
                    key={`sub-${slide.id}-${current}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }} // ⚡ Reduced
                    className="text-sm mt-4 mb-8 leading-relaxed text-brand-text-gold-muted"
                    style={{ fontFamily: "var(--font-dm), sans-serif" }}
                  >
                    {slide.subtext}
                  </motion.p>

                  {/* CTA buttons */}
                  <motion.div
                    key={`cta-${slide.id}-${current}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }} // ⚡ Reduced
                    className="flex items-center gap-4"
                  >
                    <Button
                      className="rounded-sm px-8 py-3 font-medium text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(201,168,76,0.4)] bg-brand-gold text-brand-dark border-none tracking-wider"
                      style={{
                        fontFamily: "var(--font-dm), sans-serif",
                      }}
                    >
                      <Link href={slide.ctaHref}>{slide.ctaLabel}</Link>
                    </Button>

                    <Link
                      href="/products"
                      className="text-sm font-medium tracking-wide transition-colors duration-200 flex items-center gap-2 group text-brand-text-light"
                      style={{ fontFamily: "var(--font-dm), sans-serif" }}
                    >
                      View All
                      <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Prev / Next arrows — bottom-right */}
        <div className="absolute bottom-8 right-8 md:right-12 z-20 flex items-center gap-2">
          {/* Dot indicators */}
          <div className="flex gap-1.5 mr-3" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className="transition-all duration-300 h-1.5 rounded-[3px] border-none cursor-pointer"
                style={{
                  width: i === current ? "24px" : "6px",
                  backgroundColor:
                    i === current
                      ? "#C9A84C"
                      : "rgba(201,168,76,0.3)",
                }}
              />
            ))}
          </div>

          {/* Prev */}
          <button
            aria-label="Previous slide"
            onClick={() => api?.scrollPrev()}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 text-brand-gold cursor-pointer backdrop-blur-md"
            style={{
              backgroundColor: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(201,168,76,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(201,168,76,0.15)";
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Next */}
          <button
            aria-label="Next slide"
            onClick={() => api?.scrollNext()}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 text-brand-gold cursor-pointer backdrop-blur-md"
            style={{
              backgroundColor: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(201,168,76,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(201,168,76,0.15)";
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </Carousel>
    </section>
  );
}
