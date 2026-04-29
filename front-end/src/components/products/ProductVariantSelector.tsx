'use client';

import { useState } from 'react';
import { Product, ProductVariant } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface ProductVariantSelectorProps {
  product: Product;
  onVariantSelect: (variant: ProductVariant) => void;
}

export function ProductVariantSelector({ product, onVariantSelect }: ProductVariantSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const sizes = Array.from(new Set(product.variants.filter((v) => v.size).map((v) => v.size!)));
  const colors = Array.from(new Set(product.variants.filter((v) => v.color).map((v) => v.color!)));

  const getVariantForSelection = () => {
    return product.variants.find((v) => {
      const sizeMatch = !selectedSize || v.size === selectedSize;
      const colorMatch = !selectedColor || v.color === selectedColor;
      return sizeMatch && colorMatch;
    });
  };

  const selectedVariant = getVariantForSelection();
  const inStock = selectedVariant && selectedVariant.stock > 0;

  const handleSelect = () => {
    if (selectedVariant) {
      onVariantSelect(selectedVariant);
    }
  };

  return (
    <div className="space-y-6">
      {sizes.length > 0 && (
        <div>
          <Label className="mb-3 block">Size</Label>
          <RadioGroup value={selectedSize || undefined} onValueChange={setSelectedSize}>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <Label
                  key={size}
                  className={cn(
                    'flex min-w-[50px] cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-all',
                    selectedSize === size
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:border-primary'
                  )}
                >
                  <RadioGroupItem value={size} className="sr-only" />
                  {size}
                </Label>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <Label className="mb-3 block">Color</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <Button
                key={color}
                variant={selectedColor === color ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedColor(color)}
              >
                {color}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedVariant && (
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Selected variant</p>
              <p className="font-medium">
                {selectedVariant.size && `Size: ${selectedVariant.size}`}
                {selectedVariant.size && selectedVariant.color && ' | '}
                {selectedVariant.color && `Color: ${selectedVariant.color}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {selectedVariant.salePrice
                  ? `$${selectedVariant.salePrice.toFixed(2)}`
                  : `$${selectedVariant.price.toFixed(2)}`}
              </p>
              <p className={cn('text-sm', inStock ? 'text-green-600' : 'text-red-600')}>
                {inStock ? 'In Stock' : 'Out of Stock'}
              </p>
            </div>
          </div>
        </div>
      )}

      <Button className="w-full" size="lg" disabled={!selectedVariant || !inStock} onClick={handleSelect}>
        {!selectedVariant ? 'Select options' : !inStock ? 'Out of Stock' : 'Add to Cart'}
      </Button>
    </div>
  );
}
