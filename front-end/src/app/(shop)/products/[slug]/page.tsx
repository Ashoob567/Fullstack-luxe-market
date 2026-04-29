'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { get } from '@/lib/api';
import { Product, ProductVariant } from '@/types/product';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { ProductVariantSelector } from '@/components/products/ProductVariantSelector';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { Heart, Truck, RefreshCcw } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';

export default function ProductDetailPage() {
  const params = useParams();
  const { addItem, openDrawer } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    get<Product>(`/api/products/${params.slug}/`)
      .then((data) => {
        setProduct(data);
        if (data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = () => {
    if (selectedVariant && product) {
      addItem({
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0]?.image || '',
        price: selectedVariant.price,
        salePrice: selectedVariant.salePrice,
        size: selectedVariant.size,
        color: selectedVariant.color,
        quantity: 1,
      });
      toast.success('Added to cart');
      openDrawer();
    }
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.info('Removed from wishlist');
    } else {
      addToWishlist(product.id);
      toast.success('Added to wishlist');
    }
  };

  if (loading || !product) {
    return (
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-lg bg-muted animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            <div className="h-6 w-1/4 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const discount = selectedVariant?.salePrice
    ? getDiscountPercentage(selectedVariant.price, selectedVariant.salePrice)
    : 0;

  return (
    <div className="container py-8">
      <Breadcrumb
        items={[
          { label: 'Products', href: '/products' },
          { label: product.category.name, href: `/category/${product.category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid md:grid-cols-2 gap-8">
        <ProductImageGallery images={product.images} />

        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <p className="text-muted-foreground mt-1">{product.category.name}</p>
              </div>
              <button
                onClick={handleWishlistToggle}
                className="rounded-full p-2 hover:bg-muted"
              >
                <Heart
                  className={`h-6 w-6 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`}
                />
              </button>
            </div>

            {product.tags.length > 0 && (
              <div className="flex gap-2 mt-3">
                {product.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {selectedVariant && (
              <>
                <span className="text-3xl font-bold">
                  {formatPrice(selectedVariant.salePrice ?? selectedVariant.price)}
                </span>
                {selectedVariant.salePrice && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(selectedVariant.price)}
                    </span>
                    {discount > 0 && (
                      <Badge className="bg-red-500">-{discount}%</Badge>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <Separator />

          <div className="prose prose-sm dark:prose-invert">
            <p>{product.description}</p>
          </div>

          <ProductVariantSelector
            product={product}
            onVariantSelect={handleVariantSelect}
          />

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-5 w-5 text-primary" />
              <span>Free shipping on orders over PKR 5,000</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RefreshCcw className="h-5 w-5 text-primary" />
              <span>30-day easy returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
