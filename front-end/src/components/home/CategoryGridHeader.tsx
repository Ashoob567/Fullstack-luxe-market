// src/components/home/CategoryGridHeader.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function CategoryGridHeader() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-10"
    >
      <p
        className="text-xs tracking-[0.3em] uppercase font-medium mb-2 text-brand-gold"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        Collections
      </p>

      <h2
        className="font-serif text-4xl md:text-5xl font-bold leading-tight text-brand-text-light"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
        }}
      >
        Shop by Category
      </h2>

      <div className="mt-4 h-px w-16 bg-brand-gold" />
    </motion.div>
  );
}