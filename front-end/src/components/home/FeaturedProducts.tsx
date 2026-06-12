// src/components/home/FeaturedProducts.tsx
// ✅ No "use client" — Server Component

import Link from "next/link";
import { serverGet } from '@/lib/api-server';
import type { ProductDetail, PaginatedResponse } from "@/types";
import { ProductCard } from "@/components/products/ProductCard";
import FeaturedProductsHeader from "./FeaturedProductsHeader";
import FeaturedProductsGrid from "./FeaturedProductsGrid";

async function getFeaturedProducts(): Promise<ProductDetail[]> {
  try {
    const data = await serverGet<ProductDetail[] | PaginatedResponse<ProductDetail>>(
      '/api/products/featured/',
      {
        revalidate: 60, // 1 minute cache - short to reflect backend changes quickly
        tags: ['products', 'featured'],
      }
    );

    return Array.isArray(data)
      ? data
      : (data as PaginatedResponse<ProductDetail>).results ?? [];

  } catch (err) {
    console.error('Featured products error:', err);
    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  return (
    <section className="py-20 px-4" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="mx-auto max-w-7xl">

        {/* ✅ Header — Client (animation ke liye) */}
        <FeaturedProductsHeader />

        {/* ✅ Grid — Client (animation ke liye) */}
        <FeaturedProductsGrid products={products} />

        {/* ✅ CTA */}
        {products.length > 0 && (
          <div className="mt-14 flex justify-center">
            <Link
              href="/products"
              className="rounded-sm px-10 py-3.5 text-sm font-medium tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(201,168,76,0.35)]"
              style={{
                border: "1px solid #C9A84C",
                color: "#C9A84C",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              View All Collections
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}