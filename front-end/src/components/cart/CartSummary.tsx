import { formatPrice } from '@/lib/utils';

interface CartSummaryProps {
  total: number;
}

export function CartSummary({ total }: CartSummaryProps) {
  const shippingCost = total >= 5000 ? 0 : 200;
  const tax = total * 0.16; // 16% GST
  const grandTotal = total + shippingCost + tax;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">{formatPrice(total)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Shipping</span>
        <span className="font-medium">
          {shippingCost === 0 ? (
            <span className="text-green-600">Free</span>
          ) : (
            formatPrice(shippingCost)
          )}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Tax (16%)</span>
        <span className="font-medium">{formatPrice(tax)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between text-base">
        <span className="font-semibold">Total</span>
        <span className="font-bold">{formatPrice(grandTotal)}</span>
      </div>
      {total < 5000 && (
        <p className="text-xs text-muted-foreground text-center">
          Add {formatPrice(5000 - total)} more for free shipping!
        </p>
      )}
    </div>
  );
}
