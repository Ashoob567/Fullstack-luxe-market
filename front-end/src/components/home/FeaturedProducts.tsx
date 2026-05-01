// src/components/home/FeaturedProducts.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/product";
import { SkeletonCard } from "@/components/common/SkeletonCard";

// ─────────────────────────────────────────────────────────────
// Featured Products
// ─────────────────────────────────────────────────────────────
export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const res = await fetch(
        "http://localhost:8000/api/products/featured/",
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      // Supports:
      // array response
      // { results: [] }
      const items = Array.isArray(data)
        ? data
        : data.results ?? [];

      setProducts(items);
    } catch (error) {
      console.error("Featured products error:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <section className="bg-white py-16 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#9A8870]">
            Luxe Selection
          </p>

          <h2 className="mt-3 font-serif text-4xl font-bold text-[#2C2416]">
            Featured Products
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#8C7B65]">
            Discover premium watches, luxury essentials,
            and timeless fashion curated for modern style.
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-[#D6CBBA]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#9A8870]" />
            <span className="h-px w-12 bg-[#D6CBBA]" />
          </div>
        </header>

        {/* Error State */}
        {error ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#ECE6DB] bg-[#FAF8F4] py-16 text-center">
            <p className="text-sm text-[#8C7B65]">
              We couldn’t load featured products right now.
            </p>

            <button
              onClick={fetchProducts}
              className="rounded-md border border-[#1B3A5C] px-6 py-2.5 text-sm text-[#1B3A5C] transition hover:bg-[#1B3A5C] hover:text-white"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                : products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
            </div>

            {/* Empty State */}
            {!loading &&
              !error &&
              products.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-sm text-[#8C7B65]">
                    No featured products available.
                  </p>
                </div>
              )}

            {/* CTA */}
            {!loading &&
              !error &&
              products.length > 0 && (
                <div className="mt-12 flex justify-center">
                  <Link
                    href="/products"
                    className="rounded-md border border-[#1B3A5C] px-10 py-3 text-sm font-medium tracking-wide text-[#1B3A5C] transition hover:bg-[#1B3A5C] hover:text-white"
                  >
                    View All Collections
                  </Link>
                </div>
              )}
          </>
        )}
      </div>
    </section>
  );
}