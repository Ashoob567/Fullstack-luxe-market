// src/components/home/CategoryCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link"; // ✅ window.location.href hataya
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { Category } from "@/types";

interface Props {
  category: Category;
  index: number;
}

export default function CategoryCard({ category, index }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const imageUrl = category.image && category.image.trim() ? category.image : "/placeholder.jpg";
  const tagline = category.description ?? "Discover the finest selection curated for you.";
  const href = `/category/${category.slug}`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, y: 30 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay: index * 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative rounded-2xl overflow-hidden h-[420px] md:h-[520px] group"
    >
      {/* ✅ Poora card Link hai — role="link" + window.location.href hataya */}
      <Link href={href} className="absolute inset-0 z-10" aria-label={`Browse ${category.name}`} />

      {/* Background Image */}
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
        <Image
          src={imageUrl}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          // ✅ Sirf pehle 2 cards priority honge
          priority={index < 2}
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

      {/* Gold shimmer border */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 1px rgba(201, 168, 76, 0.4)" }}
      />

      {/* Card Content */}
      <div className="absolute bottom-0 left-0 p-8 z-20">
        <p
          className="text-xs tracking-[0.25em] uppercase mb-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 text-brand-gold font-['DM_Sans',sans-serif]"
        >
          Collection
        </p>

        <h2
          className="font-serif font-bold text-3xl text-white leading-tight tracking-wide font-['Playfair_Display',Georgia,serif]"
        >
          {category.name}
        </h2>

        <div
          className="mt-2 mb-3 h-px w-0 group-hover:w-12 transition-all duration-500 bg-brand-gold"
        />

        <p
          className="text-[#D8CFC0] text-sm italic leading-snug max-w-[260px] line-clamp-2 font-['DM_Sans',sans-serif]"
        >
          {tagline}
        </p>

        {/* ✅ Button ke andar alag onClick nahi — Link poora card cover kar raha hai */}
        <div
          className="mt-5 text-sm font-medium px-6 py-2.5 rounded-sm inline-flex items-center gap-2 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(201,168,76,0.35)] bg-brand-gold text-brand-dark font-['DM_Sans',sans-serif] tracking-wider"
        >
          Explore
          <ArrowRight size={15} strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}