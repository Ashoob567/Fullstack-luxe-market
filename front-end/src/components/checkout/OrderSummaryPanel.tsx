'use client';

// src/components/checkout/OrderSummaryPanel.tsx

import Image           from 'next/image';
import { useState }    from 'react';
import { Separator }   from '@/components/ui/separator';
import { Badge }       from '@/components/ui/badge';
import { Button }      from '@/components/ui/button';
import { ShoppingBag, Truck, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { cn }          from '@/lib/utils';
import type { CartItem } from '@/types/order';

interface OrderSummaryPanelProps {
  items:          CartItem[];
  subtotal:       number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount:    number;
  couponCode?:    string | null;
  defaultOpen?:   boolean;
}

function pkr(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

export function OrderSummaryPanel({
  items,
  subtotal,
  discountAmount,
  shippingAmount,
  totalAmount,
  couponCode,
  defaultOpen = false,
}: OrderSummaryPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div>
      {/* Mobile toggle */}
      <Button
        variant="outline"
        className="w-full flex justify-between items-center md:hidden mb-3"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 text-sm">
          <ShoppingBag size={15} />
          {open ? 'Hide summary' : `Show summary (${itemCount} item${itemCount !== 1 ? 's' : ''})`}
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {pkr(totalAmount)}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </Button>

      {/* Panel */}
      <div className={cn(
        'rounded-lg border bg-card p-5 space-y-4',
        'hidden md:block',          // desktop: always visible
        open && '!block',           // mobile: show when toggled
      )}>

        <div>
          <h2 className="font-semibold tracking-tight">Order Summary</h2>
          <p className="text-xs text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
        </div>

        <Separator />

        {/* Item list */}
        <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map((item) => {
            const price     = item.salePrice ?? item.price;
            const lineTotal = price * item.quantity;
            return (
              <li
                key={`${item.productId}-${item.variantId}`}
                className="flex items-start gap-3"
              >
                {/* Image */}
                <div className="relative w-14 h-16 shrink-0 rounded-md border bg-muted overflow-hidden">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ShoppingBag size={16} />
                    </div>
                  )}
                  {/* Qty badge */}
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[item.size, item.color].filter(Boolean).join(' · ')}
                  </p>
                  {item.salePrice && (
                    <p className="text-xs text-muted-foreground line-through">{pkr(item.price)}</p>
                  )}
                </div>

                {/* Line total */}
                <p className="text-sm font-medium shrink-0">{pkr(lineTotal)}</p>
              </li>
            );
          })}
        </ul>

        {/* Coupon badge */}
        {couponCode && (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-800 gap-1">
            <Tag size={11} />
            {couponCode}
            <span className="font-bold">−{pkr(discountAmount)}</span>
          </Badge>
        )}

        <Separator />

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{pkr(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-green-700 font-medium">
              <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
              <span>−{pkr(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Truck size={13} /> Shipping
            </span>
            <span>
              {shippingAmount === 0
                ? <span className="text-green-700 font-medium">Free</span>
                : pkr(shippingAmount)
              }
            </span>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>{pkr(totalAmount)}</span>
          </div>

          {shippingAmount > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              Free shipping on orders over PKR 3,000
            </p>
          )}
        </div>

      </div>
    </div>
  );
}