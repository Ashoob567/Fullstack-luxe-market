'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { EmptyState } from '@/components/common/EmptyState';
import { useRouter } from 'next/navigation';

export function CartDrawer() {
  const { isOpen, closeDrawer, items, totalPrice } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    closeDrawer();
    router.push('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeDrawer}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              title="Your cart is empty"
              description="Add some products to get started"
              actionText="Browse Products"
              onAction={() => {
                closeDrawer();
                router.push('/products');
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <CartItem key={item.variantId} item={item} />
              ))}
            </div>

            <div className="border-t pt-4 space-y-4">
              <CartSummary total={totalPrice} />
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
