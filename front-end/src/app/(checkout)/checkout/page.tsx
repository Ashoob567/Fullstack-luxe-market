'use client';

// src/app/(checkout)/checkout/page.tsx

import { useEffect, useState }          from 'react';
import { useRouter }                    from 'next/navigation';
import { FormProvider, useForm }        from 'react-hook-form';
import { zodResolver }                  from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import { toast }                        from 'sonner';
import { Button }                       from '@/components/ui/button';
import { Separator }                    from '@/components/ui/separator';
import { AddressForm }                  from '@/components/checkout/AddressForm';
import { PaymentForm }                  from '@/components/checkout/PaymentForm';
import { OrderSummaryPanel }            from '@/components/checkout/OrderSummaryPanel';
import { useCheckout }                  from '@/hooks/useCheckout';
import { mockCardSchema }               from '@/lib/validations/checkout';
import { get }                          from '@/lib/api';
import type { CartItem }                from '@/types/order';

// ── Progress bar ──────────────────────────────────────────────────────────────

const STEPS = ['Cart', 'Checkout', 'Confirmation'] as const;

function ProgressBar() {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border
            ${i === 0 ? 'bg-foreground text-background border-foreground'
            : i === 1 ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted text-muted-foreground border-border'}`}
          >
            {i === 0 ? '✓' : i + 1}
          </div>
          <span className={i === 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
            {step}
          </span>
          {i < STEPS.length - 1 && <ChevronRight size={14} className="text-muted-foreground mx-0.5" />}
        </div>
      ))}
    </nav>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();

  const [cart,        setCart]        = useState<CartItem[]>([]);
  const [subtotal,    setSubtotal]    = useState(0);
  const [discount,    setDiscount]    = useState(0);
  const [shipping,    setShipping]    = useState(200);
  const [total,       setTotal]       = useState(0);
  const [couponCode,  setCouponCode]  = useState<string | null>(null);
  const [cartLoading, setCartLoading] = useState(true);

  const checkout = useCheckout();

  // FormProvider for MockCardInput's useFormContext
  const cardForm = useForm({
    resolver: zodResolver(mockCardSchema),
    mode: 'onChange',
  });

  // Sync card form validity → checkout hook
  useEffect(() => {
    const sub = cardForm.watch((values) => {
      const result = mockCardSchema.safeParse(values);
      checkout.onCardDataChange(result.success ? result.data : null);
    });
    return () => sub.unsubscribe();
  }, [cardForm, checkout]);

  // Fetch cart from backend Redis (requires auth — api.ts attaches Bearer token)
  useEffect(() => {
    async function fetchCart() {
      try {
        const data = await get<{ items: CartItem[]; discount_amount?: number; coupon_code?: string | null }>(
          '/api/cart/'
        );
        const items: CartItem[] = data.items ?? [];
        if (items.length === 0) { router.push('/cart'); return; }

        // Backend cart items use `price` field (stored as float in Redis)
        const sub  = items.reduce((acc, i) => acc + (i.salePrice ?? i.price) * i.quantity, 0);
        const disc = data.discount_amount ?? 0;
        const ship = sub >= 3000 ? 0 : 200;

        setCart(items);
        setSubtotal(sub);
        setDiscount(disc);
        setShipping(ship);
        setTotal(sub - disc + ship);
        setCouponCode(data.coupon_code ?? null);
      } catch (err: any) {
        if (err?.response?.status === 401) { router.push('/login'); return; }
        toast.error('Could not load your cart. Please try again.');
      } finally {
        setCartLoading(false);
      }
    }
    fetchCart();
  }, [router]);

  if (cartLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={30} />
        <p className="text-sm">Loading checkout…</p>
      </div>
    );
  }

  return (
    <FormProvider {...cardForm}>
      <div className="min-h-screen bg-background">

        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <a href="/" className="font-bold text-lg tracking-tight">Luxe Market</a>
            <ProgressBar />
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          {/* Mobile: summary collapsed at top */}
          <div className="md:hidden mb-6">
            <OrderSummaryPanel
              items={cart}
              subtotal={subtotal}
              discountAmount={discount}
              shippingAmount={shipping}
              totalAmount={total}
              couponCode={couponCode}
              defaultOpen={false}
            />
          </div>

          {/* 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-8 items-start">

            {/* Left — forms */}
            <div className="space-y-6">

              {/* Address */}
              <div className="rounded-lg border bg-card p-6">
                <AddressForm onChange={checkout.onAddressChange} />
              </div>

              <Separator />

              {/* Payment */}
              <div className="rounded-lg border bg-card p-6">
                <PaymentForm
                  selectedMethod={checkout.selectedMethod}
                  onMethodChange={checkout.onMethodChange}
                  isDiscreet={checkout.isDiscreet}
                  onDiscreetChange={checkout.onDiscreetChange}
                  notes={checkout.notes}
                  onNotesChange={checkout.onNotesChange}
                  totalAmount={total.toLocaleString('en-PK')}
                />
              </div>

              {/* Place Order */}
              <div className="space-y-3">
                <Button
                  size="md"
                  className="w-full"
                  disabled={!checkout.canSubmit() || checkout.isSubmitting}
                  onClick={checkout.placeOrder}
                >
                  {checkout.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : checkout.selectedMethod === 'cod' ? (
                    `Place Order · PKR ${total.toLocaleString('en-PK')}`
                  ) : (
                    `Pay PKR ${total.toLocaleString('en-PK')}`
                  )}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck size={13} />
                  256-bit SSL encryption · Your data is secure
                </p>
              </div>

            </div>

            {/* Right — summary (desktop only) */}
            <div className="hidden md:block sticky top-20">
              <OrderSummaryPanel
                items={cart}
                subtotal={subtotal}
                discountAmount={discount}
                shippingAmount={shipping}
                totalAmount={total}
                couponCode={couponCode}
                defaultOpen={true}
              />
            </div>

          </div>
        </main>
      </div>
    </FormProvider>
  );
}