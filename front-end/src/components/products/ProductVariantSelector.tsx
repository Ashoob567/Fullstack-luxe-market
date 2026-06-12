'use client';

import { useState, useEffect } from 'react';
import { ProductDetail, ProductVariant } from '@/types/product';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface ProductVariantSelectorProps {
  product: ProductDetail;
  onVariantSelect: (variant: ProductVariant) => void;
  onAddToCart?: () => void;
}

export function ProductVariantSelector({ product, onVariantSelect, onAddToCart }: ProductVariantSelectorProps) {
  // Derive initial size/color from the first variant so the parent's
  // "Add to Cart" button is enabled immediately on page load.
  const firstVariant = product.variants?.[0] ?? null;
  const [selectedSize, setSelectedSize] = useState<string | null>(
    firstVariant?.size ?? null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    firstVariant?.color ?? null
  );

  // Unique sizes & colors derived from variants
  const sizes = Array.from(
    new Set(product.variants.filter((v) => v.size).map((v) => v.size!))
  );
  const colors = Array.from(
    new Set(product.variants.filter((v) => v.color).map((v) => v.color!))
  );

  // Find the variant that matches both current selections (partial match allowed)
  const getVariantForSelection = (): ProductVariant | undefined => {
    return product.variants.find((v) => {
      const sizeMatch = !selectedSize || v.size === selectedSize;
      const colorMatch = !selectedColor || v.color === selectedColor;
      return sizeMatch && colorMatch;
    });
  };

  // Check whether any variant with the given size/color attribute is in stock
  const isSizeAvailable = (size: string): boolean =>
    product.variants.some((v) => v.size === size && v.is_in_stock);

  const isColorAvailable = (color: string): boolean =>
    product.variants.some((v) => v.color === color && v.is_in_stock);

  const selectedVariant = getVariantForSelection();

  // Use the backend-computed `is_in_stock` flag (stock_qty > 0 @property)
  const inStock = selectedVariant?.is_in_stock ?? false;

  // On mount: notify parent of the pre-selected initial variant so the
  // parent's "Add to Cart" button is enabled without requiring user interaction.
  useEffect(() => {
    if (firstVariant) {
      onVariantSelect(firstVariant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent immediately whenever the resolved variant changes
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    // Find the matching variant with the new size + current color
    const match = product.variants.find((v) => {
      const sizeMatch = v.size === size;
      const colorMatch = !selectedColor || v.color === selectedColor;
      return sizeMatch && colorMatch;
    });
    if (match) onVariantSelect(match);
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    // Find the matching variant with the current size + new color
    const match = product.variants.find((v) => {
      const sizeMatch = !selectedSize || v.size === selectedSize;
      const colorMatch = v.color === color;
      return sizeMatch && colorMatch;
    });
    if (match) onVariantSelect(match);
  };

  return (
    <div className="space-y-6">
      {/* ── SIZE SELECTOR ── */}
      {sizes.length > 0 && (
        <div>
          <Label className="mb-3 block text-sm font-semibold">Size</Label>
          <RadioGroup
            value={selectedSize ?? undefined}
            onValueChange={handleSizeChange}
          >
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const available = isSizeAvailable(size);
                const isSelected = selectedSize === size;

                return (
                  <Label
                    key={size}
                    className={cn(
                      'flex min-w-[50px] cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-all select-none',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : available
                        ? 'hover:border-primary'
                        : 'cursor-not-allowed opacity-40 line-through'
                    )}
                  >
                    <RadioGroupItem
                      value={size}
                      disabled={!available}
                      className="sr-only"
                    />
                    {size}
                  </Label>
                );
              })}
            </div>
          </RadioGroup>
        </div>
      )}

      {/* ── COLOR SELECTOR ── */}
      {colors.length > 0 && (
        <div>
          <Label className="mb-3 block text-sm font-semibold">Color</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const available = isColorAvailable(color);
              const isSelected = selectedColor === color;

              return (
                <Button
                  key={color}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  disabled={!available}
                  onClick={() => handleColorChange(color)}
                  className={cn(!available && 'opacity-40 line-through')}
                >
                  {color}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SELECTED VARIANT SUMMARY ── */}
      {selectedVariant && (
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">Selected variant</p>
              <p className="font-medium">
                {selectedVariant.size && `Size: ${selectedVariant.size}`}
                {selectedVariant.size && selectedVariant.color && ' · '}
                {selectedVariant.color && `Color: ${selectedVariant.color}`}
              </p>
              {/* SKU shown for reference / accessibility */}
              <p className="text-xs text-muted-foreground">
                SKU: {selectedVariant.sku}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="font-semibold">
                Rs {Number(selectedVariant.final_price).toFixed(2)}
              </p>

              {/* price_modifier hint (non-zero only) */}
              {Number(selectedVariant.price_modifier) !== 0 && (
                <p className="text-xs text-muted-foreground">
                  {Number(selectedVariant.price_modifier) > 0 ? '+' : ''}
                  Rs {Number(selectedVariant.price_modifier).toFixed(2)} modifier
                </p>
              )}

              <p className={cn('text-sm font-medium', inStock ? 'text-green-600' : 'text-red-500')}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}