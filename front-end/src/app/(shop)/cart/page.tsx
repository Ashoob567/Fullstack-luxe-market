'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { CartItem as CartItemComponent } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const { items, totalPrice } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet"
          actionText="Start Shopping"
          onAction={() => router.push('/products')}
        />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">Shopping Cart</h1>

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItemComponent key={item.variantId} item={item} />
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-6">
            <CartSummary total={totalPrice} />
          </div>

          <Button className="w-full" size="lg" onClick={() => router.push('/checkout')}>
            Proceed to Checkout
          </Button>

          <Link href="/products">
            <Button variant="ghost" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
