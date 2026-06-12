'use client';

import { useState } from 'react';
import { ProductDetail, ProductVariant } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BRAND = {
  navy: '#1B3A5C',
  sand: '#F5F3EF',
  espresso: '#2C2416',
} as const;

interface VariantModalProps {
  product: ProductDetail;
  onClose: () => void;
  onConfirm: (variant: ProductVariant) => void;
}

export function VariantModal({ product, onClose, onConfirm }: VariantModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedVariant = product.variants.find((v) => v.id === selectedId) ?? null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl p-6 mx-4"
        style={{ backgroundColor: BRAND.sand }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-1" style={{ color: BRAND.espresso }}>
          Select Variant
        </h3>
        <p className="text-xs text-muted-foreground mb-4">{product.name}</p>

        <div className="space-y-2">
          {product.variants.map((variant) => {
            const active = variant.id === selectedId;
            const outOfStock = !variant.is_in_stock;

            return (
              <button
                key={variant.id}
                disabled={outOfStock}
                onClick={() => setSelectedId(variant.id)}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-left transition',
                  active && 'border-[#1B3A5C] bg-white',
                  outOfStock && 'opacity-40 cursor-not-allowed'
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">
                      {variant.size || 'Standard'}
                      {variant.color && ` • ${variant.color}`}
                    </p>
                    <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">Rs{Number(variant.final_price).toFixed(2)}</p>
                    {outOfStock && <p className="text-[10px] text-red-500 uppercase">Out of stock</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 text-white"
            style={{ backgroundColor: BRAND.navy }}
            disabled={!selectedVariant}
            onClick={() => {
              if (selectedVariant) {
                onConfirm(selectedVariant);
                onClose();
              }
            }}
          >
            Add To Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
