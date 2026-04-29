'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Breadcrumb } from '@/components/common/Breadcrumb';

const ProductsContent = dynamic(() => import('@/components/products/ProductsContent'), {
  ssr: false,
});

export default function ProductsPage() {
  return (
    <div className="container py-8">
      <Breadcrumb items={[{ label: 'Products', href: '/products' }]} />
      <Suspense fallback={<div className="mt-8 text-muted-foreground">Loading products...</div>}>
        <ProductsContent />
      </Suspense>
    </div>
  );
}