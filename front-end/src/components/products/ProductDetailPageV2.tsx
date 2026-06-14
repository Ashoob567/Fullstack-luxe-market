'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Heart, ArrowRight, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ProductList, ProductColorVariant, ProductSizeVariant } from '@/types';
import type { CartItem } from '@/types';

import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';

interface ProductDetailPageV2Props {
  product: ProductList;
}

export function ProductDetailPageV2({ product }: ProductDetailPageV2Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useCartStore((s) => s.addItem);
  const updateItem = useCartStore((s) => s.updateItem);
  const cartItems = useCartStore((s) => s.items);
  const { isInWishlist, toggleWishlist: toggleWishlistStore, isLoading: wishlistLoading } = useWishlistStore();

  // Check if we're in edit mode
  const editCartItemId = searchParams.get('edit');
  const isEditMode = !!editCartItemId;
  const existingCartItem = useMemo(() => {
    if (!editCartItemId) return null;
    return cartItems.find(item => item.cart_item_id === editCartItemId) || null;
  }, [editCartItemId, cartItems]);

  // State
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const wishlisted = isInWishlist(product.id);

  // Get available colors from NEW structure
  const availableColors = useMemo((): ProductColorVariant[] => {
    if (product.color_variants_new && product.color_variants_new.length > 0) {
      return product.color_variants_new.filter((cv) => cv.is_in_stock);
    }
    return [];
  }, [product.color_variants_new]);

  // Initialize state from existing cart item when in edit mode
  useEffect(() => {
    if (existingCartItem && availableColors.length > 0) {
      // Find the color index matching the cart item
      const colorIndex = availableColors.findIndex(
        (cv) => cv.color_name === existingCartItem.color
      );
      if (colorIndex >= 0) {
        setSelectedColorIndex(colorIndex);

        // Find the size variant matching the cart item
        const sizeVariant = availableColors[colorIndex].size_variants.find(
          (sv) => sv.size_name === existingCartItem.size
        );
        if (sizeVariant) {
          setSelectedSizeId(sizeVariant.id);
        }
      }

      setQuantity(existingCartItem.quantity);
    }
  }, [existingCartItem, availableColors]);

  // Current selected color
  const selectedColor = useMemo(() => {
    return availableColors[selectedColorIndex] || null;
  }, [availableColors, selectedColorIndex]);

  // Current display image
  const displayImage = useMemo(() => {
    return selectedColor?.image_url || product.primary_image || '/placeholder.png';
  }, [selectedColor, product.primary_image]);

  // Available sizes for selected color
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

  // Stock info
  const stockLeft = useMemo(() => {
    if (selectedSize) {
      return selectedSize.stock_quantity;
    }
    // Sum all variant stocks
    return availableColors.reduce((total, color) => {
      return total + color.size_variants.reduce((sum, size) => sum + size.stock_quantity, 0);
    }, 0);
  }, [selectedSize, availableColors]);

  // Handlers
  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    setSelectedSizeId(null); // Reset size selection when color changes
  };

  const handleSizeClick = (sizeId: string) => {
    setSelectedSizeId(sizeId);
  };

  const handleWishlist = async () => {
    await toggleWishlistStore(product.id, {
      name: product.name,
      price: String(displayPrice),
      image: displayImage,
      slug: product.slug,
      category: product.category_name || '',
    });
  };

  const handleProceedToCheckout = async () => {
    if (!availableColors.length) {
      toast.error('This product is currently unavailable');
      return;
    }

    if (!selectedSize || !selectedColor) {
      toast.info('Please select a size');
      return;
    }

    try {
      if (isEditMode && editCartItemId) {
        // Update existing cart item
        await updateItem(editCartItemId, {
          variant_id: selectedSize.id,
          image: displayImage,
          price: selectedSize.final_price,
          size: selectedSize.size_name,
          color: selectedColor.color_name,
          quantity,
          slug: product.slug,
        });
        toast.success('Cart item updated!');
      } else {
        // Add new cart item
        const cartItem: Omit<CartItem, 'cart_item_id'> = {
          product_id: product.id,
          variant_id: selectedSize.id,
          name: product.name,
          image: displayImage,
          price: selectedSize.final_price,
          size: selectedSize.size_name,
          color: selectedColor.color_name,
          quantity,
          slug: product.slug,
        };

        await addItem(cartItem);
        toast.success('Added to cart!');
      }

      router.push('/checkout');
    } catch (error) {
      toast.error('Failed to update cart');
      console.error('Cart operation failed:', error);
    }
  };

  const hasVariants = availableColors.length > 0;

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left Column - Image */}
          <div className="space-y-4">
            {/* Badge Container */}
            <div className="flex gap-2 mb-4">
              {product.is_flash_active && (
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase bg-red-600 animate-pulse">
                  ⚡ FLASH SALE
                </span>
              )}
              {discountPercentage > 0 && !product.is_flash_active && (
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-brand-blue-light">
                  {discountPercentage}% OFF
                </span>
              )}
              {product.tags && product.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase"
                  style={{
                    backgroundColor: tag.slug === 'new-arrival' ? '#10B981'
                      : tag.slug === 'sale' ? '#EF4444'
                      : tag.slug === 'trending' ? '#F59E0B'
                      : tag.slug === 'limited-edition' ? '#8B5CF6'
                      : '#5B9BD5'
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>

            {/* Main Image */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
              <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Brand & Collection */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest font-semibold text-brand-gold">
                {product.category_name || 'NOIR ATELIER'} — AW 2024
              </p>
              <h1
                className="text-4xl lg:text-5xl font-serif leading-tight text-brand-text-light"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {product.name}
              </h1>
              {product.description && (
                <p className="text-base italic text-brand-text-muted">
                  {product.description}
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4"
                    fill={i < Math.round(product.average_rating || 0) ? '#FDCB6E' : 'none'}
                    stroke={i < Math.round(product.average_rating || 0) ? '#FDCB6E' : '#6B8FAF'}
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-semibold text-brand-text-light">
                {product.average_rating?.toFixed(1) || '4.0'}
              </span>
              <span className="text-sm text-brand-text-muted">
                · {product.review_count || 84} reviews
              </span>
              <button className="text-sm underline text-brand-gold">
                READ ALL
              </button>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-brand-text-light">
                Rs. {displayPrice.toLocaleString()}
              </span>
              {originalPrice && (
                <>
                  <span className="text-xl line-through text-brand-text-muted">
                    Rs. {originalPrice.toLocaleString()}
                  </span>
                  {discountPercentage > 0 && (
                    <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded">
                      Save {discountPercentage}%
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Color Selection */}
            {hasVariants && availableColors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-text-muted">
                    COLOR
                  </p>
                  {selectedColor && (
                    <p className="text-sm text-brand-text-light">
                      Selected: <span className="font-semibold uppercase">{selectedColor.color_name}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((colorVariant, index) => {
                    const isSelected = index === selectedColorIndex;
                    return (
                      <button
                        key={colorVariant.id}
                        onClick={() => handleColorChange(index)}
                        className={cn(
                          'h-12 w-12 rounded-full border-3 transition-all hover:scale-110',
                          isSelected ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-900' : 'border-gray-600'
                        )}
                        style={{
                          backgroundColor: colorVariant.hex_primary,
                          borderColor: isSelected ? 'white' : '#4B5563'
                        }}
                        aria-label={`Select ${colorVariant.color_name} color`}
                        title={colorVariant.color_name}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {hasVariants && availableSizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-text-muted">
                    SIZE
                  </p>
                  <button className="text-sm underline text-brand-gold">
                    SIZE GUIDE
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {availableSizes.map((sizeVariant) => (
                    <button
                      key={sizeVariant.id}
                      onClick={() => handleSizeClick(sizeVariant.id)}
                      className={cn(
                        'px-4 py-3 rounded-lg text-sm font-semibold transition-all border-2',
                        selectedSizeId === sizeVariant.id
                          ? 'border-white text-white bg-white/10'
                          : 'border-gray-600 text-gray-300 hover:border-gray-400'
                      )}
                    >
                      {sizeVariant.size_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-text-muted">
                QUANTITY
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-12 h-12 rounded-lg border-2 border-gray-600 hover:border-white transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-brand-text-light"
                >
                  <Minus size={18} />
                </button>
                <span className="text-2xl font-bold w-16 text-center text-brand-text-light">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= stockLeft}
                  className="w-12 h-12 rounded-lg border-2 border-gray-600 hover:border-white transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-brand-text-light"
                >
                  <Plus size={18} />
                </button>
                <span className="text-sm ml-2 text-brand-text-muted">
                  ● {stockLeft} left in stock
                </span>
              </div>
            </div>

            {/* Proceed to Checkout Button */}
            <Button
              onClick={handleProceedToCheckout}
              disabled={!selectedSize || !hasVariants}
              className="w-full rounded-xl py-6 text-base font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-brand-dark"
              style={{ backgroundColor: '#D4A574' }}
            >
              {isEditMode ? 'UPDATE CART & CHECKOUT' : 'PROCEED TO CHECKOUT'}
              <ArrowRight size={20} className="ml-2" />
            </Button>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-600 hover:border-white transition-all disabled:opacity-50 text-brand-text-light"
            >
              <Heart
                size={18}
                fill={wishlisted ? '#DC2626' : 'none'}
                stroke={wishlisted ? '#DC2626' : 'currentColor'}
              />
              {wishlisted ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
