'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { get } from '@/lib/api';
import { Product, Category } from '@/types/product';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Breadcrumb } from '@/components/common/Breadcrumb';

export default function CategoryPage() {
  const params = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      get<Category>(`/api/categories/${params.slug}/`),
      get<{ results: Product[] }>(`/api/products/?category=${params.slug}`),
    ])
      .then(([categoryData, productsData]) => {
        setCategory(categoryData);
        setProducts(productsData.results);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-square w-full rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Category not found</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Breadcrumb
        items={[
          { label: 'Products', href: '/products' },
          { label: category.name },
        ]}
      />

      <div className="mt-8">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
