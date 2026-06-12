import { serverGet } from '@/lib/api-server';
import { PaginatedResponse, ProductList, Category } from '@/types';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ProductsPageClient } from '@/components/products/ProductsPageClient';

async function getProducts(): Promise<PaginatedResponse<ProductList>> {
  return serverGet<PaginatedResponse<ProductList>>('/api/products/', {
    revalidate: 3600,
    tags: ['products'],
  });
}

async function getCategories(): Promise<Category[]> {
  return serverGet<Category[]>('/api/categories/', {
    revalidate: 3600,
    tags: ['categories'],
  });
}

export default async function ProductsPage() {
  const [productsData, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="container py-8">
      <Breadcrumb items={[{ label: 'Products', href: '/products' }]} />
      <ProductsPageClient
        initialProducts={productsData.results}
        categories={categories}
      />
    </div>
  );
}

export const metadata = {
  title: 'All Products | Luxe Market',
  description: 'Browse our luxury collection of premium products',
};
