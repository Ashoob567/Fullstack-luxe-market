// src/components/home/FeaturedProductsHeader.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function FeaturedProductsHeader() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.header
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-14 text-center"
    >
      <p
        className="text-xs font-medium uppercase tracking-[0.3em] text-brand-gold font-['DM_Sans']"
      >
        Luxe Selection
      </p>

      <h2
        className="mt-3 text-4xl md:text-5xl font-bold text-brand-text-light font-['Playfair_Display']"
      >
        Featured Products
      </h2>

      <p
        className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-text-muted font-['DM_Sans']"
      >
        Discover premium watches, luxury essentials,
        and timeless fashion curated for modern style.
      </p>

      {/* Gold ornament */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <span className="h-px w-12 bg-brand-gold" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
        <span className="h-px w-12 bg-brand-gold" />
      </div>
    </motion.header>
  );
}