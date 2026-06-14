'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { get } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import type { CartItem } from '@/types';
import type { ProductDetail, ProductVariant } from '@/types/product';

interface VariantSelectorModalProps {
  cartItem: CartItem;
  open: boolean;
  onClose: () => void;
}

// Group variants by color for easier selection
interface ColorGroup {
  color: string;
  variants: ProductVariant[];
  image_url: string | null;
}

export function VariantSelectorModal({ cartItem, open, onClose }: VariantSelectorModalProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(cartItem.quantity);

  const { removeItem, addItem } = useCartStore();

  // Fetch product details
  useEffect(() => {
    if (!open || !cartItem.slug) return;

    async function fetchProduct() {
      setLoading(true);
      try {
        const data = await get<ProductDetail>(`/api/products/${cartItem.slug}/`);
        setProduct(data);
      } catch (error) {
        toast.error('Failed to load product variants');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [open, cartItem.slug]);

  // Group variants by color
  const colorGroups = useMemo((): ColorGroup[] => {
    if (!product?.variants) return [];

    const colorMap = new Map<string, ProductVariant[]>();

    product.variants.forEach((variant) => {
      const color = variant.color || 'Default';
      if (!colorMap.has(color)) {
        colorMap.set(color, []);
      }
      colorMap.get(color)!.push(variant);
    });

    return Array.from(colorMap.entries()).map(([color, variants]) => {
      // Find image for this color
      const image = product.images.find((img) => img.color === color);
      return {
        color,
        variants: variants.filter((v) => v.is_in_stock),
        image_url: image?.url || product.primary_image,
      };
    }).filter((group) => group.variants.length > 0);
  }, [product]);

  // Get current color group and selected variant
  const currentColorGroup = useMemo(
    () => colorGroups.find((g) => g.color === selectedColor),
    [colorGroups, selectedColor]
  );

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => v.id === selectedVariantId) || null;
  }, [product, selectedVariantId]);

  // Set initial selections when product loads
  useEffect(() => {
    if (colorGroups.length > 0 && !selectedColor) {
      const firstColor = colorGroups[0].color;
      setSelectedColor(firstColor);

      // Auto-select first variant of first color if available
      if (colorGroups[0].variants.length > 0) {
        setSelectedVariantId(colorGroups[0].variants[0].id);
      }
    }
  }, [colorGroups, selectedColor]);

  // Calculate display price and image
  const displayPrice = selectedVariant ? Number(selectedVariant.final_price) : Number(product?.effective_price || 0);
  const displayImage = currentColorGroup?.image_url || cartItem.image;

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setSelectedVariantId(''); // Reset variant when color changes

    // Auto-select first variant of new color
    const newGroup = colorGroups.find((g) => g.color === color);
    if (newGroup && newGroup.variants.length > 0) {
      setSelectedVariantId(newGroup.variants[0].id);
    }
  };

  const handleSave = async () => {
    if (!selectedVariant || !selectedColor) {
      toast.info('Please select a size and color');
      return;
    }

    try {
      // Remove old cart item
      await removeItem(cartItem.cart_item_id);

      // Add new cart item with updated variant
      const newCartItem: Omit<CartItem, 'cart_item_id'> = {
        product_id: cartItem.product_id,
        variant_id: selectedVariant.id,
        name: cartItem.name,
        image: displayImage,
        price: selectedVariant.final_price,
        size: selectedVariant.size || '',
        color: selectedColor,
        quantity,
        slug: cartItem.slug,
      };

      await addItem(newCartItem);
      toast.success('Variant updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update variant');
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Select Size & Color</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : product ? (
          <div className="space-y-6 py-4">
            {/* Product Info */}
            <div className="flex gap-4">
              <img
                src={displayImage}
                alt={cartItem.name}
                className="w-24 h-24 object-cover rounded-lg border"
              />
              <div>
                <h3 className="font-semibold text-lg">{cartItem.name}</h3>
                <p className="text-2xl font-bold mt-2">Rs. {displayPrice.toLocaleString()}</p>
              </div>
            </div>

            {/* Color Selection */}
            {colorGroups.length > 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-muted-foreground">COLOR</p>
                  {selectedColor && (
                    <p className="text-sm">
                      Selected: <span className="font-semibold">{selectedColor}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {colorGroups.map((group) => {
                    const isSelected = group.color === selectedColor;
                    return (
                      <button
                        key={group.color}
                        onClick={() => handleColorChange(group.color)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-gray-300 hover:border-primary'
                        }`}
                        aria-label={`Select ${group.color} color`}
                        title={group.color}
                      >
                        {group.color}
                        {isSelected && <Check className="inline-block ml-1 w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {currentColorGroup && currentColorGroup.variants.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">SIZE</p>
                <div className="flex flex-wrap gap-2">
                  {currentColorGroup.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-6 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                        selectedVariantId === variant.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      {variant.size || 'One Size'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">QUANTITY</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-primary transition-colors flex items-center justify-center font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-primary transition-colors flex items-center justify-center font-semibold text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!selectedVariant} className="flex-1">
                Update Cart
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Failed to load product details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
