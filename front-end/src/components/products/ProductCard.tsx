'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

import { Card } from '@/components/ui/card';
import { ProductCardImage } from './ProductCardImage';
import { ProductCardActions } from './ProductCardActions';
import { StarRating } from './StarRating';
import { PriceDisplay } from './PriceDisplay';
import { VariantModal } from './VariantModal';

import type { ProductDetail, ProductList as ProductCardShape, ProductVariant } from '@/types';
import type { CartItem } from '@/types';

import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';

const BRAND = {
  espresso: '#2C2416',
  red: '#C0392B',
} as const;

interface ProductCardProps {
  product: ProductDetail | ProductCardShape;
  priority?: boolean; // For LCP optimization - set true for above-the-fold images
}

// Memoize the ProductCard component to prevent unnecessary re-renders
export const ProductCard = memo(function ProductCard({ product, priority = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const router = useRouter();
  const { isInWishlist, toggleWishlist: toggleWishlistStore, isLoading: wishlistLoading } = useWishlistStore();
  const [showModal, setShowModal] = useState(false);

  const wishlisted = isInWishlist(product.id);

  // Cache expensive computations - moved outside useMemo for better performance
  const imageUrl = product.primary_image ||
    ('images' in product && Array.isArray(product.images)
      ? (product.images.find((img) => img.is_primary)?.url || product.images[0]?.url || '/placeholder.png')
      : '/placeholder.png');

  const variants: ProductVariant[] =
    ('variants' in product && Array.isArray(product.variants) ? product.variants : []);

  const cheapestVariant = useMemo<ProductVariant | undefined>(() => {
    if (variants.length === 0) return undefined;
    // Optimization: Use reduce instead of sort for O(n) vs O(n log n)
    return variants.reduce((min, v) =>
      Number(v.final_price) < Number(min.final_price) ? v : min
    );
  }, [variants]);

  const inStock = variants.length > 0
    ? variants.some((v) => v.is_in_stock)
    : product.is_in_stock;

  const hasVariants = variants.length > 1;

  const displayPrice = cheapestVariant
    ? Number(cheapestVariant.final_price)
    : Number(product.effective_price);

  const originalPrice = (product.is_flash_active || product.is_on_sale)
    ? Number(product.base_price)
    : null;

  const discountPercentage = useMemo(() => {
    const value = Number(product.discount_percentage ?? 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [product.discount_percentage]);

  const categoryLabel =
    'category_name' in product ? (product.category_name ?? '') : (product.category?.name ?? '');

  const createCartItem = useCallback(
    (variant: ProductVariant): Omit<CartItem, 'cart_item_id'> => {
      const finalPrice = Number(variant.final_price).toFixed(2);

      return {
        product_id: product.id,
        variant_id: variant.id,
        name: product.name,
        image: imageUrl,
        price: finalPrice,
        size: variant.size ?? '',
        color: variant.color ?? '',
        quantity: 1,
      };
    },
    [product, imageUrl]
  );

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prepare product data for guest wishlist
    await toggleWishlistStore(product.id, {
      name: product.name,
      price: String(displayPrice),
      image: imageUrl,
      slug: product.slug,
      category: categoryLabel,
    });
  };

  const handleAddToCart = () => {
    if (hasVariants) {
      setShowModal(true);
      return;
    }
    if (cheapestVariant) {
      addItem(createCartItem(cheapestVariant));
      toast.success('Added to cart');
      openDrawer();
      return;
    }
    toast.info('Select a variant to add to cart');
    router.push(`/products/${product.slug}`);
  };

  const handleBuyNow = () => {
    if (hasVariants) {
      setShowModal(true);
      return;
    }
    if (cheapestVariant) {
      addItem(createCartItem(cheapestVariant));
      toast.success('Added to cart');
      router.push('/checkout');
      return;
    }
    toast.info('Select a variant to continue');
    router.push(`/products/${product.slug}`);
  };

  return (
    <>
      <Card className="group relative overflow-hidden rounded-xl border border-[#E8E4DC] hover:shadow-md transition">
        <div className="relative">
          <ProductCardImage
            imageUrl={imageUrl}
            productName={product.name}
            isFlashActive={product.is_flash_active}
            isOnSale={product.is_on_sale}
            priority={priority}
          />

          {/* Wishlist button overlay */}
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Heart
              size={14}
              fill={wishlisted ? BRAND.red : 'none'}
              stroke={wishlisted ? BRAND.red : '#9C9488'}
            />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-widest text-[#9C9488]">{categoryLabel}</p>

          <h3 className="text-sm font-medium line-clamp-1" style={{ color: BRAND.espresso }}>
            {product.name}
          </h3>

          <StarRating rating={product.average_rating} size={11} />

          <PriceDisplay
            price={displayPrice}
            originalPrice={originalPrice}
            discountPercentage={discountPercentage}
            size="sm"
          />

          <ProductCardActions inStock={inStock} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
        </div>
      </Card>

      {showModal && 'variants' in product && (
        <VariantModal
          product={product as ProductDetail}
          onClose={() => setShowModal(false)}
          onConfirm={(variant) => {
            addItem(createCartItem(variant));
            toast.success('Added to cart');
            openDrawer();
          }}
        />
      )}
    </>
  );
});

export default ProductCard;
