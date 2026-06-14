'use client';

import { useState, useEffect } from 'react';
import { getFlashSaleProducts } from '@/services/productService';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ProductList, PaginatedResponse } from '@/types';

export default function SalePage() {
  const [data, setData] = useState<PaginatedResponse<ProductList> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSaleProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getFlashSaleProducts();
        setData(result);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load sale products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSaleProducts();
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

  // ── Sale page ─────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Sale' },
        ]}
      />

      {/* Header */}
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-rose-600 font-serif">
          🔥 Flash Sale
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Limited-time deals — grab them before they&apos;re gone!
        </p>
        <p className="mt-1 text-sm text-brand-text-gold-muted">
          {products.length} product{products.length !== 1 ? 's' : ''} on sale
        </p>
      </div>

      {/* Product grid */}
      <ProductGrid products={products} />
    </div>
  );
}
