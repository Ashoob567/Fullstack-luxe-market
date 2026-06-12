'use client';

import { ProductList } from '@/types/product';
import { ProductCardV2 } from './ProductCardV2';
import { EmptyState } from '@/components/common/EmptyState';

interface ProductGridProps {
  products: ProductList[];
  loading?: boolean;
}

/**
 * ProductGrid - Uses ProductCardV2 with normalized structure
 *
 * ✅ Normalized: Product → ColorVariant (with image) → SizeVariant
 * ✅ Image stored once per color (efficient!)
 * ✅ Direct hex colors from database (no hardcoded mapping)
 */
export function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-square w-full rounded-2xl bg-gray-800 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-gray-800 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-gray-800 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try adjusting your filters or search query"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCardV2 key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}
