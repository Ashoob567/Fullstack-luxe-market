'use client';

import { Button } from '@/components/ui/button';
import { ShoppingCart, Zap } from 'lucide-react';

const BRAND = {
  navy: '#1B3A5C',
} as const;

interface ProductCardActionsProps {
  inStock: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export function ProductCardActions({ inStock, onAddToCart, onBuyNow }: ProductCardActionsProps) {
  return (
    <>
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          className="flex-1 text-white"
          style={{ backgroundColor: BRAND.navy }}
          disabled={!inStock}
          onClick={onAddToCart}
        >
          <ShoppingCart size={14} />
          Add
        </Button>
        <Button size="sm" variant="outline" className="flex-1" disabled={!inStock} onClick={onBuyNow}>
          <Zap size={14} />
          Buy
        </Button>
      </div>

      {!inStock && (
        <p className="text-[10px] uppercase text-center text-muted-foreground">Out of Stock</p>
      )}
    </>
  );
}
