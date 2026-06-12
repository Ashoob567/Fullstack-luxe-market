'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ProductList, ColorVariant } from '@/types';
import type { CartItem } from '@/types';

import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';

const BRAND_COLORS = {
  darkBg: '#2A2D3A',
  accentBlue: '#5B6EF5',
  textLight: '#E8E9F0',
  textMuted: '#A0A3B8',
  red: '#EF4444',
} as const;

// Color name to hex mapping
const COLOR_HEX_MAP: Record<string, string> = {
  'Cobalt Indigo': '#5B6EF5',
  'Lagoon': '#00CEC9',
  'Peach': '#FF7B7B',
  'Poplar': '#FDCB6E',
  'Ocean': '#0984E3',
  'Scarlet': '#D63031',
  'Purple': '#A29BFE',
  'Black': '#2D3436',
  'White': '#DFE6E9',
  'Red': '#D63031',
  'Blue': '#0984E3',
  'Green': '#00B894',
  'Yellow': '#FDCB6E',
  'Orange': '#E17055',
  'Pink': '#FD79A8',
  'Gray': '#636E72',
  'Brown': '#6C5CE7',
  'Default': '#B2BEC3',
};

interface ProductCardNewProps {
  product: ProductList;
  priority?: boolean;
}

export function ProductCardNew({ product, priority = false }: ProductCardNewProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { isInWishlist, toggleWishlist: toggleWishlistStore, isLoading: wishlistLoading } = useWishlistStore();

  // State
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const wishlisted = isInWishlist(product.id);

  // Get available colors from color_variants
  const availableColors = useMemo(() => {
    return product.color_variants?.filter((cv) => cv.in_stock) || [];
  }, [product.color_variants]);

  // Current selected color
  const selectedColor = useMemo(() => {
    return availableColors[selectedColorIndex] || null;
  }, [availableColors, selectedColorIndex]);

  // Current display image
  const displayImage = useMemo(() => {
    return selectedColor?.image_url || product.primary_image || '/placeholder.png';
  }, [selectedColor, product.primary_image]);

  // Available sizes for selected color
  const availableSizes = useMemo(() => {
    return selectedColor?.sizes || [];
  }, [selectedColor]);

  // Selected variant based on color and size
  const selectedVariant = useMemo(() => {
    if (!selectedSize || !selectedColor) return null;
    return selectedColor.sizes.find((s) => s.size === selectedSize) || null;
  }, [selectedColor, selectedSize]);

  // Calculate display price
  const displayPrice = useMemo(() => {
    if (selectedVariant) {
      return Number(selectedVariant.final_price);
    }
    return Number(product.effective_price);
  }, [selectedVariant, product.effective_price]);

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
    setSelectedSize(null); // Reset size selection when color changes
  };

  const handleSizeClick = (size: string) => {
    setSelectedSize(size);
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
    if (!selectedVariant) {
      toast.info('Please select a size');
      return;
    }

    const cartItem: Omit<CartItem, 'cart_item_id'> = {
      product_id: product.id,
      variant_id: selectedVariant.variant_id,
      name: product.name,
      image: displayImage,
      price: selectedVariant.final_price,
      size: selectedVariant.size,
      color: selectedColor?.color || '',
      quantity: 1,
    };

    addItem(cartItem);
    toast.success('Added to cart');
    openDrawer();
  };

  const handleBuyNow = () => {
    if (!selectedVariant) {
      toast.info('Please select a size');
      return;
    }

    const cartItem: Omit<CartItem, 'cart_item_id'> = {
      product_id: product.id,
      variant_id: selectedVariant.variant_id,
      name: product.name,
      image: displayImage,
      price: selectedVariant.final_price,
      size: selectedVariant.size,
      color: selectedColor?.color || '',
      quantity: 1,
    };

    addItem(cartItem);
    router.push('/checkout');
  };

  return (
    <Card
      className="group relative overflow-hidden rounded-2xl border-0 transition-all hover:shadow-2xl hover:-translate-y-1"
      style={{ backgroundColor: BRAND_COLORS.darkBg }}
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gradient-to-br from-gray-700 to-gray-800">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: BRAND_COLORS.accentBlue }}
          >
            {discountPercentage}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart
            size={16}
            fill={wishlisted ? BRAND_COLORS.red : 'none'}
            stroke={wishlisted ? BRAND_COLORS.red : '#9C9488'}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <p
          className="text-[10px] uppercase tracking-widest font-semibold"
          style={{ color: BRAND_COLORS.textMuted }}
        >
          {product.category_name || 'UNCATEGORIZED'}
        </p>

        {/* Product Name */}
        <h3
          className="text-base font-semibold line-clamp-2 leading-tight"
          style={{ color: BRAND_COLORS.textLight }}
        >
          {product.name}
        </h3>

        {/* Subtitle */}
        <p className="text-xs" style={{ color: BRAND_COLORS.textMuted }}>
          {product.description || 'Series V'}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className="w-3 h-3"
                fill={i < Math.round(product.average_rating || 0) ? '#FDCB6E' : 'none'}
                stroke={i < Math.round(product.average_rating || 0) ? '#FDCB6E' : BRAND_COLORS.textMuted}
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <span className="text-[11px] font-semibold" style={{ color: BRAND_COLORS.textLight }}>
            {product.average_rating?.toFixed(1) || '0.0'}
          </span>
          <span className="text-[10px]" style={{ color: BRAND_COLORS.textMuted }}>
            ({product.review_count || 0} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold" style={{ color: BRAND_COLORS.textLight }}>
            Rs. {displayPrice.toLocaleString()}
          </span>
          {originalPrice && (
            <>
              <span className="text-sm line-through" style={{ color: BRAND_COLORS.textMuted }}>
                Rs. {originalPrice.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-green-400">Save {discountPercentage}%</span>
            </>
          )}
        </div>

        {/* Size Selection */}
        {availableSizes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: BRAND_COLORS.textMuted }}>
              SIZE
            </p>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((sizeObj) => (
                <button
                  key={sizeObj.size}
                  onClick={() => handleSizeClick(sizeObj.size)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    selectedSize === sizeObj.size
                      ? 'text-white border-transparent'
                      : 'border-gray-600 hover:border-gray-500'
                  )}
                  style={{
                    backgroundColor: selectedSize === sizeObj.size ? BRAND_COLORS.accentBlue : 'transparent',
                    color: selectedSize === sizeObj.size ? '#fff' : BRAND_COLORS.textLight,
                  }}
                >
                  {sizeObj.size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Selection */}
        {availableColors.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: BRAND_COLORS.textMuted }}>
                COLOR
              </p>
              {selectedColor && (
                <p className="text-xs" style={{ color: BRAND_COLORS.textLight }}>
                  Selected: <span className="font-semibold">{selectedColor.color}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((colorVariant, index) => {
                const hexColor = COLOR_HEX_MAP[colorVariant.color] || COLOR_HEX_MAP.Default;
                const isSelected = index === selectedColorIndex;

                return (
                  <button
                    key={`${colorVariant.color}-${index}`}
                    onClick={() => handleColorChange(index)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-all hover:scale-110',
                      isSelected ? 'border-white shadow-lg' : 'border-gray-600'
                    )}
                    style={{ backgroundColor: hexColor }}
                    aria-label={`Select ${colorVariant.color} color`}
                  >
                    {isSelected && (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Buy Now Button */}
        <Button
          onClick={handleBuyNow}
          disabled={!selectedVariant}
          className="w-full rounded-xl py-6 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: BRAND_COLORS.accentBlue }}
        >
          Buy Now — Rs. {displayPrice.toLocaleString()}
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </Card>
  );
}
