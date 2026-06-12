'use client';

import { useState, useEffect } from 'react';
import { getNewArrivals } from '@/services/productService';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ProductList, PaginatedResponse } from '@/types';

export default function NewArrivalsPage() {
  const [data, setData] = useState<PaginatedResponse<ProductList> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getNewArrivals();
        setData(result);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load new arrivals');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNewArrivals();
  }, []);

  const products = data?.results ?? [];

  // ── Loading skeleton ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-4 w-32 rounded bg-muted animate-pulse mb-6" />
        <div className="h-8 w-48 rounded bg-muted animate-pulse mb-2" />
        <div className="h-4 w-72 rounded bg-muted animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] w-full rounded-xl bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">
        <p>{error}</p>
      </div>
    );
  }

  // ── New Arrivals page ─────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'New Arrivals' },
        ]}
      />

      {/* Header */}
      <div className="mt-6 mb-8">
        <h1
          className="text-3xl font-bold text-[#2C2416]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          New Arrivals
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Discover our latest additions — fresh styles added just for you.
        </p>
        <p className="mt-1 text-sm text-[#A89880]">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Product grid */}
      <ProductGrid products={products} />
    </div>
  );
}
