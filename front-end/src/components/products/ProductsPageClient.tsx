'use client';

import { useState } from 'react';
import { ProductList, Category } from '@/types/product';
import { ProductGrid } from '@/components/products/ProductGrid';
import { FilterPanel } from '@/components/products/FilterPanel';
import { SortDropdown } from '@/components/products/SortDropdown';

interface ProductsPageClientProps {
  initialProducts: ProductList[];
  categories: Category[];
}

export function ProductsPageClient({ initialProducts, categories }: ProductsPageClientProps) {
  const [products] = useState<ProductList[]>(initialProducts);
  const [sortOrder, setSortOrder] = useState('default');

  const handleFilterChange = (filters: Record<string, unknown>) => {
    console.log('Filters changed:', filters);
    // TODO: Implement actual filtering logic
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    // TODO: Implement actual sorting logic
  };

  return (
    <>
      <div className="mt-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
        <SortDropdown value={sortOrder} onChange={handleSortChange} />
      </div>

      <div className="mt-8 flex gap-8">
        <FilterPanel categories={categories} onFilterChange={handleFilterChange} />
        <div className="flex-1">
          <ProductGrid products={products} loading={false} />
        </div>
      </div>
    </>
  );
}
