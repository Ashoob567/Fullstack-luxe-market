'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ProductList, ProductColorVariant, ProductSizeVariant } from '@/types';
import type { CartItem } from '@/types';

import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';

interface ProductCardV2Props {
  product: ProductList;
  priority?: boolean;
}

/**
 * ProductCardV2 - Uses NEW structure: Product → ColorVariant → SizeVariant
 *
 * Features:
 * - Direct color-to-image relationship (no manual matching)
 * - Hex colors from database (no hardcoded mapping)
 * - Clean hierarchy: select color → see its image + available sizes
 */
export function ProductCardV2({ product, priority = false }: ProductCardV2Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { isInWishlist, toggleWishlist: toggleWishlistStore, isLoading: wishlistLoading } = useWishlistStore();

  // State
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);

  const wishlisted = isInWishlist(product.id);

  // Get available colors from NEW structure (with fallback to old)
  const availableColors = useMemo((): ProductColorVariant[] => {
    // Use new structure if available
    if (product.color_variants_new && product.color_variants_new.length > 0) {
      return product.color_variants_new.filter((cv) => cv.is_in_stock);
    }
    // Fallback: convert old structure to new format
    return [];
  }, [product.color_variants_new]);

  // Current selected color
  const selectedColor = useMemo(() => {
    return availableColors[selectedColorIndex] || null;
  }, [availableColors, selectedColorIndex]);

  // Current display image - directly from color variant!
  const displayImage = useMemo(() => {
    const colorImg = selectedColor?.image_url?.trim();
    const primaryImg = product.primary_image?.trim();
    return colorImg || primaryImg || '/placeholder.png';
  }, [selectedColor, product.primary_image]);

  // Available sizes for selected color - directly from size_variants!
  const availableSizes = useMemo((): ProductSizeVariant[] => {
    if (!selectedColor) return [];
    return selectedColor.size_variants.filter((sv) => sv.is_in_stock);
  }, [selectedColor]);

  // Selected size variant
  const selectedSize = useMemo(() => {
    if (!selectedSizeId || !selectedColor) return null;
    return selectedColor.size_variants.find((s) => s.id === selectedSizeId) || null;
  }, [selectedColor, selectedSizeId]);

  // Calculate display price
  const displayPrice = useMemo(() => {
    if (selectedSize) {
      return Number(selectedSize.final_price);
    }
    return Number(product.effective_price);
  }, [selectedSize, product.effective_price]);

  const originalPrice = useMemo(() => {
    return product.is_flash_active || product.is_on_sale ? Number(product.base_price) : null;
  }, [product.is_flash_active, product.is_on_sale, product.base_price]);

  const discountPercentage = useMemo(() => {
    const value = Number(product.discount_percentage ?? 0);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  }, [product.discount_percentage]);

  // Handlers
  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    setSelectedSizeId(null); // Reset size selection when color changes
  };

  const handleSizeClick = (sizeId: string) => {
    setSelectedSizeId(sizeId);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlistStore(product.id, {
      name: product.name,
      price: String(displayPrice),
      image: displayImage,
      slug: product.slug,
      category: product.category_name || '',
      
    });
  };

  const handleAddToCart = () => {
    // If product has variants, require selection
    if (hasVariants) {
      if (!selectedSize || !selectedColor) {
        toast.info('Please select a size');
        return;
      }

      const cartItem: Omit<CartItem, 'cart_item_id'> = {
        product_id: product.id,
        variant_id: selectedSize.id,
        name: product.name,
        image: displayImage,
        price: selectedSize.final_price,
        size: selectedSize.size_name,
        color: selectedColor.color_name,
        quantity: 1,
        slug: product.slug,
      };

      addItem(cartItem);
      toast.success('Added to cart');
      openDrawer();
      return;
    }

    // Simple product without variants
    toast.info('This product is currently unavailable');
  };

  const handleBuyNow = () => {
    // Add to cart with first available variant, then open cart drawer
    if (hasVariants && selectedColor && availableSizes.length > 0) {
      const firstSize = availableSizes[0];

      const cartItem: Omit<CartItem, 'cart_item_id'> = {
        product_id: product.id,
        variant_id: firstSize.id,
        name: product.name,
        image: displayImage,
        price: firstSize.final_price,
        size: firstSize.size_name,
        color: selectedColor.color_name,
        quantity: 1,
        slug: product.slug,
      };

      addItem(cartItem);
      toast.success('Added to cart! You can adjust size/color in cart.');
      openDrawer();
    } else {
      // No variants available - navigate to product page
      router.push(`/products/${product.slug}`);
    }
  };

  // If no color variants available, show simplified card without size/color selection
  const hasVariants = availableColors.length > 0;

  return (
    <Card
      className="group relative overflow-hidden rounded-2xl border-0 bg-brand-dark transition-all hover:shadow-2xl hover:-translate-y-1"
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gradient-to-br from-gray-700 to-gray-800">
        <Image
          src={displayImage}
          alt={`${product.name} - ${selectedColor?.color_name}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Badges Container */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {/* Flash Sale Badge (Highest Priority) */}
          {product.is_flash_active && (
            <div className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase animate-pulse bg-brand-red">
              ⚡ FLASH SALE
            </div>
          )}

          {/* Discount Badge */}
          {discountPercentage > 0 && !product.is_flash_active && (
            <div className="px-3 py-1 rounded-full text-xs font-bold text-white bg-brand-blue-light">
              {discountPercentage}% OFF
            </div>
          )}

          {/* Product Tags Badges (NEW ARRIVAL, SALE, etc.) */}
          {product.tags && product.tags.length > 0 && (
            <>
              {product.tags.map((tag) => (
                <div
                  key={tag.id}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold text-white uppercase",
                    tag.slug === 'new-arrival' && 'bg-green-500',
                    tag.slug === 'sale' && 'bg-red-500',
                    tag.slug === 'trending' && 'bg-orange-500',
                    tag.slug === 'limited-edition' && 'bg-purple-500',
                    !['new-arrival', 'sale', 'trending', 'limited-edition'].includes(tag.slug) && 'bg-brand-blue-light'
                  )}
                >
                  {tag.name}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart
            size={16}
            className={wishlisted ? 'fill-brand-red stroke-brand-red' : 'fill-none stroke-gray-400'}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <p className="text-[10px] uppercase tracking-widest font-semibold text-brand-text-muted">
          {product.category_name || 'UNCATEGORIZED'}
        </p>

        {/* Product Name */}
        <h3 className="text-base font-semibold line-clamp-2 leading-tight text-brand-text-light">
          {product.name}
        </h3>

        {/* Subtitle */}
        {product.description && (
          <p className="text-xs line-clamp-1 text-brand-text-muted">
            {product.description}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < Math.round(product.average_rating || 0)
                    ? "fill-yellow-400 stroke-yellow-400"
                    : "fill-none stroke-brand-text-muted"
                )}
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-brand-text-light">
            {product.average_rating?.toFixed(1) || '0.0'}
          </span>
          <span className="text-[10px] text-brand-text-muted">
            ({product.review_count || 0} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-text-light">
            Rs. {displayPrice.toLocaleString()}
          </span>
          {originalPrice && (
            <>
              <span className="text-sm line-through text-brand-text-muted">
                Rs. {originalPrice.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-green-400">Save {discountPercentage}%</span>
            </>
          )}
        </div>

        {/* Size Selection - Only show if product has variants */}
        {hasVariants && availableSizes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-brand-text-muted">
              SIZE
            </p>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((sizeVariant) => (
                <button
                  key={sizeVariant.id}
                  onClick={() => handleSizeClick(sizeVariant.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    selectedSizeId === sizeVariant.id
                      ? 'bg-brand-blue-light text-white border-transparent'
                      : 'bg-transparent text-brand-text-light border-gray-600 hover:border-gray-500'
                  )}
                >
                  {sizeVariant.size_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Selection - Only show if product has variants */}
        {hasVariants && availableColors.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-brand-text-muted">
                COLOR
              </p>
              {selectedColor && (
                <p className="text-xs text-brand-text-light">
                  Selected: <span className="font-semibold">{selectedColor.color_name}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((colorVariant, index) => {
                const isSelected = index === selectedColorIndex;

                return (
                  <button
                    key={colorVariant.id}
                    onClick={() => handleColorChange(index)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-all hover:scale-110',
                      isSelected ? 'border-white shadow-lg' : 'border-gray-600'
                    )}
                    style={{ backgroundColor: colorVariant.hex_primary }}
                    aria-label={`Select ${colorVariant.color_name} color`}
                    title={colorVariant.color_name}
                  >
                    {isSelected && (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Status or Buy Button */}
        <Button
          onClick={handleBuyNow}
          className="w-full rounded-xl py-6 text-sm font-semibold text-white bg-brand-blue-light transition-all hover:shadow-lg"
        >
          Buy Now — Rs. {displayPrice.toLocaleString()}
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </Card>
  );
}
