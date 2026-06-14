// src/components/home/FeaturedProductsGrid.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ProductCardV2 } from "@/components/products/ProductCardV2";
import type { ProductDetail } from "@/types";

interface Props {
  products: ProductDetail[];
}

/**
 * FeaturedProductsGrid - Uses ProductCardV2 with normalized structure
 *
 * ✅ Normalized: Product → ColorVariant (with image) → SizeVariant
 * ✅ Smooth animations with framer-motion
 */
export default function FeaturedProductsGrid({ products }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-brand-text-muted">
          No featured products available.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((product, i) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.55,
            delay: 0.1 + i * 0.07,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <ProductCardV2
            product={product}
            priority={i < 4} // LCP optimization: eager-load first 4 images (above fold on desktop)
          />
        </motion.div>
      ))}
    </div>
  );
}