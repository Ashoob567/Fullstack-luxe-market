'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { get } from '@/lib/api';
import { Product } from '@/types/product';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Breadcrumb } from '@/components/common/Breadcrumb';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    setLoading(true);
    get<{ results: Product[] }>(`/api/products/?search=${encodeURIComponent(query)}`)
      .then((data) => setProducts(data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="container py-8">
      <Breadcrumb items={[{ label: `Search: "${query}"` }]} />

      <div className="mt-8">
        <h1 className="text-3xl font-bold">
          {query ? `Search results for "${query}"` : 'Search'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="mt-8">
        <ProductGrid products={products} loading={loading} />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-8">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}