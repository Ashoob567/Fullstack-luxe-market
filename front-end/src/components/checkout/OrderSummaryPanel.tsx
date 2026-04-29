import { CartItem } from '@/types/order';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';

interface OrderSummaryPanelProps {
  items: CartItem[];
  shippingCost?: number;
}

export function OrderSummaryPanel({ items, shippingCost = 200 }: OrderSummaryPanelProps) {
  const subtotal = items.reduce((sum, item) => {
    const price = item.salePrice ?? item.price;
    return sum + price * item.quantity;
  }, 0);

  const actualShipping = subtotal >= 5000 ? 0 : shippingCost;
  const tax = subtotal * 0.16;
  const total = subtotal + actualShipping + tax;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="font-semibold text-lg">Order Summary</h3>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{item.name}</h4>
              <p className="text-xs text-muted-foreground">
                Qty: {item.quantity} x {formatPrice(item.salePrice ?? item.price)}
              </p>
              {item.size && (
                <p className="text-xs text-muted-foreground">Size: {item.size}</p>
              )}
            </div>
            <p className="font-medium text-sm">
              {formatPrice((item.salePrice ?? item.price) * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{actualShipping === 0 ? 'Free' : formatPrice(actualShipping)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax (16%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
