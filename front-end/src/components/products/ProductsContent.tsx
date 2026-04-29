'use client';

import { useEffect, useState } from 'react';
import { get } from '@/lib/api';
import { Product, Category } from '@/types/product';
import { ProductGrid } from '@/components/products/ProductGrid';
import { FilterPanel } from '@/components/products/FilterPanel';
import { SortDropdown } from '@/components/products/SortDropdown';

export default function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('default');

  useEffect(() => {
    Promise.all([
      get<{ results: Product[] }>('/api/products/'),
      get<Category[]>('/api/categories/'),
    ])
      .then(([productsData, categoriesData]) => {
        setProducts(productsData.results);
        setCategories(categoriesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (filters: Record<string, unknown>) => {
    console.log('Filters changed:', filters);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
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
          <ProductGrid products={products} loading={loading} />
        </div>
      </div>
    </>
  );
}