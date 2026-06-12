import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/api-server';
import { ProductDetail } from '@/types/product';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ProductDetailClient } from '@/components/products/Productdetailclient';

async function getProduct(slug: string): Promise<ProductDetail> {
  try {
    return await serverGet<ProductDetail>(`/api/products/${slug}/`, {
      revalidate: 3600,
      tags: ['product', `product-${slug}`],
    });
  } catch {
    notFound();
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  return {
    title: `${product.name} | Luxe Market`,
    description: product.description || `Shop ${product.name} at Luxe Market`,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.primary_image ? [product.primary_image] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return (
    <div className="container py-8">
      <Breadcrumb
        items={[
          { label: 'Products', href: '/products' },
          ...(product.category
            ? [{ label: product.category.name, href: `/category/${product.category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-8">
        <ProductDetailClient product={product} />
      </div>
    </div>
  );
}
