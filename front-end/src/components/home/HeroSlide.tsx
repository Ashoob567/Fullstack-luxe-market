// Server Component - Static first slide for instant LCP
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroSlideProps {
  bg: string;
  imageSrc: string;
  gradientFrom: string;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  priority?: boolean;
}

export function HeroSlide({
  bg,
  imageSrc,
  gradientFrom,
  headline,
  subtext,
  ctaLabel,
  ctaHref,
  priority = false,
}: HeroSlideProps) {
  return (
    <div
      className="relative overflow-hidden w-full min-h-[480px] md:min-h-[85vh] flex items-end"
      style={{ backgroundColor: bg }}
    >
      {/* Noise texture */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Image - optimized */}
      <Image
        src={imageSrc}
        alt=""
        fill
        priority={priority}
        quality={75}
        sizes="100vw"
        loading={priority ? "eager" : "lazy"}
        className="object-cover object-center"
        style={{ objectFit: "cover" }}
        fetchPriority={priority ? "high" : "low"}
        unoptimized
      />

      {/* Gradients */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: `linear-gradient(to right, ${gradientFrom}E6 0%, ${gradientFrom}99 45%, transparent 75%)`,
        }}
      />
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: `linear-gradient(to top, ${gradientFrom}CC 0%, transparent 50%)`,
        }}
      />

      {/* Content - NO animations for instant render */}
      <div className="absolute bottom-1/3 left-10 md:left-20 z-10 max-w-sm md:max-w-lg">
        <span
          className="block mb-4 text-xs tracking-[0.3em] uppercase"
          style={{ color: "#C9A84C" }}
        >
          Luxe Market
        </span>

        <div className="mb-4 h-px w-12" style={{ backgroundColor: "#C9A84C" }} />

        {/* LCP ELEMENT - Critical h2 */}
        <h2
          className="font-bold text-5xl md:text-7xl leading-[1.05] whitespace-pre-line mb-2"
          style={{
            color: "#F5F0E8",
            fontFamily: "var(--font-serif), Georgia, serif",
            textShadow: "0 2px 40px rgba(0,0,0,0.4)",
          }}
        >
          {headline}
        </h2>

        <p
          className="text-sm mt-4 mb-8 leading-relaxed"
          style={{ color: "#B5A98A", fontFamily: "var(--font-dm), sans-serif" }}
        >
          {subtext}
        </p>

        <div className="flex items-center gap-4">
          <Button
            className="rounded-sm px-8 py-3 font-medium text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(201,168,76,0.4)]"
            style={{
              backgroundColor: "#C9A84C",
              color: "#0a0a0a",
              border: "none",
              fontFamily: "var(--font-dm), sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>

          <Link
            href="/products"
            className="text-sm font-medium tracking-wide transition-colors duration-200 flex items-center gap-2 group"
            style={{ color: "#F5F0E8", fontFamily: "var(--font-dm), sans-serif" }}
          >
            View All
            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
