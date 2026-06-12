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
        className="text-xs font-medium uppercase tracking-[0.3em]"
        style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}
      >
        Luxe Selection
      </p>

      <h2
        className="mt-3 text-4xl md:text-5xl font-bold"
        style={{
          color: "#F5F0E8",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}
      >
        Featured Products
      </h2>

      <p
        className="mx-auto mt-3 max-w-xl text-sm leading-relaxed"
        style={{ color: "#6B8FAF", fontFamily: "'DM Sans', sans-serif" }}
      >
        Discover premium watches, luxury essentials,
        and timeless fashion curated for modern style.
      </p>

      {/* Gold ornament */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <span className="h-px w-12" style={{ backgroundColor: "#C9A84C" }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#C9A84C" }} />
        <span className="h-px w-12" style={{ backgroundColor: "#C9A84C" }} />
      </div>
    </motion.header>
  );
}