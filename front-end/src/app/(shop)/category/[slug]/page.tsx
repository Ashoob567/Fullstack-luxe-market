'use client';

import { useParams } from 'next/navigation';
import { useCategoryBySlug } from '@/hooks/useCategories';
import { useProductList } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Breadcrumb } from '@/components/common/Breadcrumb';

export default function CategoryPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : (params.slug?.[0] ?? '');

  const { category, isLoading: catLoading, error: catError } = useCategoryBySlug(slug);
  const { data, isLoading: prodLoading, error: prodError } = useProductList({ category: slug });

  const isLoading = catLoading || prodLoading;
  const error = catError || prodError;
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

  // ── Error / not found ─────────────────────────────────────────
  if (error || !category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">
        <p>{error ?? 'Category not found'}</p>
      </div>
    );
  }

  // ── Category page ─────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: category.name },
        ]}
      />

      {/* Header */}
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-[#2C2416] font-serif">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground max-w-2xl">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-brand-text-gold-muted">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Product grid */}
      <ProductGrid products={products} />
    </div>
  );
}
