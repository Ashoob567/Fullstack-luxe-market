'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { AddressForm } from '@/components/checkout/AddressForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { OrderSummaryPanel } from '@/components/checkout/OrderSummaryPanel';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Separator } from '@/components/ui/separator';
import { post } from '@/lib/api';
import { toast } from 'sonner';
import { PaymentMethod } from '@/types/order';

enum CheckoutStep {
  Address,
  Payment,
  Review,
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(CheckoutStep.Address);
  const [shippingAddress, setShippingAddress] = useState<Record<string, unknown> | null>(null);

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <p className="text-center text-muted-foreground">
          Your cart is empty. Add some products before checking out.
        </p>
      </div>
    );
  }

  const handleAddressSubmit = (data: Record<string, unknown>) => {
    setShippingAddress(data);
    setStep(CheckoutStep.Payment);
  };

  const handlePaymentSubmit = async (method: PaymentMethod) => {
    try {
      const orderData = {
        items: items.map((item) => ({
          product: item.productId,
          variant: item.variantId,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddress,
        payment_method: method,
      };

      await post('/api/orders/', orderData);

      clearCart();
      toast.success('Order placed successfully!');
      router.push('/order/success');
    } catch (error) {
      console.error('Order failed:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="container py-8">
      <Breadcrumb items={[{ label: 'Checkout' }]} />

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: 'Address' },
              { num: 2, label: 'Payment' },
              { num: 3, label: 'Review' },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.num}
                </div>
                <span className={`ml-2 text-sm ${i <= step ? 'font-medium' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                {i < 2 && <Separator className="mx-4 h-px w-8" />}
              </div>
            ))}
          </div>

          {step === CheckoutStep.Address && (
            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              <AddressForm
                onSubmit={handleAddressSubmit}
                defaultValues={user ? {
                  firstName: user.firstName,
                  lastName: user.lastName,
                  phone: user.phone || '',
                } : undefined}
              />
            </div>
          )}

          {step === CheckoutStep.Payment && shippingAddress && (
            <div className="rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <PaymentForm onSubmit={handlePaymentSubmit} />
            </div>
          )}
        </div>

        <div>
          <OrderSummaryPanel items={items} />
        </div>
      </div>
    </div>
  );
}
