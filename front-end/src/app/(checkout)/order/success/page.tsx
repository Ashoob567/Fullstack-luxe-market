'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderSuccessPage() {
  return (
    <div className="container py-16">
      <div className="max-w-md mx-auto text-center">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold">Order Placed Successfully!</h1>
        <p className="text-muted-foreground mt-4">
          Thank you for your order. We will send you a confirmation email shortly.
        </p>

        <div className="mt-8 space-y-4">
          <Button  size="lg">
            <Link href="/account/orders">View Your Orders</Link>
          </Button>
          <Button  variant="ghost">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
