import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet } from '@/lib/api-server';
import { ProductList } from '@/types/product';
import { ProductDetailPageV2 } from '@/components/products/ProductDetailPageV2';

async function getProduct(slug: string): Promise<ProductList> {
  try {
    // Fetch products from list endpoint with large page size
    // The list endpoint includes color_variants_new which we need
    const response = await serverGet<{ results: ProductList[]; count: number }>(
      `/api/products/?page_size=100`,
      {
        revalidate: 3600,
        tags: ['products'],
      }
    );

    if (!response.results || response.results.length === 0) {
      notFound();
    }

    // Find the specific product by slug
    const product = response.results.find((p) => p.slug === slug);

    if (!product) {
      notFound();
    }

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
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

  return <ProductDetailPageV2 product={product} />;
}
