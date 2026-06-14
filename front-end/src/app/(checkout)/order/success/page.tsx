'use client';

// src/app/(checkout)/order/success/page.tsx
//
// Shown after a successful order placement.
// Reads ?id= from URL → fetches GET /api/orders/<id>/ → displays confirmation.

import { useEffect, useState } from 'react';
import { useSearchParams }     from 'next/navigation';
import Link                    from 'next/link';
import { Loader2, CheckCircle2, PackageCheck, MapPin, CreditCard, Banknote } from 'lucide-react';
import { Button }    from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge }     from '@/components/ui/badge';
import { cn }        from '@/lib/utils';
import type { Order } from '@/types/order';
import { useCartStore } from '@/store/cartStore';
import { get }          from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function pkr(amount: string | number): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `PKR ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

const STATUS_BADGE: Record<string, string> = {
  pending:   'border-yellow-300 bg-yellow-50 text-yellow-800',
  confirmed: 'border-blue-300 bg-blue-50 text-blue-800',
  shipped:   'border-purple-300 bg-purple-50 text-purple-800',
  delivered: 'border-green-300 bg-green-50 text-green-800',
  cancelled: 'border-red-300 bg-red-50 text-red-800',
};

const PAYMENT_BADGE: Record<string, string> = {
  pending:  'border-yellow-300 bg-yellow-50 text-yellow-800',
  paid:     'border-green-300 bg-green-50 text-green-800',
  failed:   'border-red-300 bg-red-50 text-red-800',
  refunded: 'border-blue-300 bg-blue-50 text-blue-800',
};

// ── Animated checkmark ────────────────────────────────────────────────────────

function AnimatedCheck() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-green-50 border-4 border-green-200 animate-[scale-in_0.4s_ease-out]">
        <CheckCircle2
          className="text-green-600 animate-[fade-in_0.3s_ease-out_0.2s_both]"
          size={44}
          strokeWidth={1.5}
        />
        {/* Ripple rings */}
        <span className="absolute inset-0 rounded-full border-2 border-green-300 animate-ping opacity-30" />
      </div>
    </div>
  );
}

// ── Order items table ─────────────────────────────────────────────────────────

function OrderItemsTable({ order }: { order: Order }) {
  return (
    <div className="space-y-3">
      {order.items.map((item) => (
        <div
          key={item.id}
          className="flex items-start justify-between gap-4 py-3 border-b last:border-0"
        >
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.name}</p>
            {item.variant && Object.keys(item.variant || {}).length > 0 && (
              <p className="text-xs text-muted-foreground">
                {Object.entries(item.variant || {})
                  .filter(([k]) => k !== 'sku')
                  .map(([, v]) => v)
                  .join(' · ')}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-medium">{pkr(item.subtotal)}</p>
            <p className="text-xs text-muted-foreground">{pkr(item.unit_price)} each</p>
          </div>
        </div>
      ))}

      {/* Totals */}
      <div className="space-y-1.5 pt-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{pkr(order.subtotal)}</span>
        </div>
        {parseFloat(order.discount_amount) > 0 && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
            <span>−{pkr(order.discount_amount)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>
            {parseFloat(order.shipping_amount) === 0
              ? <span className="text-green-700 font-medium">Free</span>
              : pkr(order.shipping_amount)
            }
          </span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>{pkr(order.total_amount)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId      = searchParams.get('id');

  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  // Clear cart store on mount (after successful order)
  useEffect(() => {
    const clearCart = useCartStore.getState().clearCart;
    clearCart();
  }, []);

  // Fetch order details using api.ts (auto-attaches Bearer token)
  useEffect(() => {
    if (!orderId) { setError(true); setLoading(false); return; }

    async function fetchOrder() {
      try {
        const data = await get<Order>(`/api/orders/${orderId}/`);
        setOrder(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" size={30} />
        <p className="text-sm">Loading your order…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <PackageCheck size={48} className="text-muted-foreground" />
        <h1 className="text-xl font-semibold">Order not found</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          We couldn't find your order details. Please check your email for confirmation,
          or contact support.
        </p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="border-b bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/" className="font-bold text-lg tracking-tight">Luxe Market</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Hero confirmation block ─────────────────────────────────── */}
        <div className="text-center space-y-4">
          <AnimatedCheck />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Order Confirmed!</h1>
            <p className="text-muted-foreground text-sm">
              Thank you for your purchase. We'll get it ready for you.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Order</span>
            <span className="font-mono font-semibold">{order.order_number}</span>
            <Badge
              variant="outline"
              className={cn('text-xs', STATUS_BADGE[order.status])}
            >
              {order.status_display}
            </Badge>
          </div>
        </div>

        {/* ── Estimated delivery ──────────────────────────────────────── */}
        {/* @ts-ignore - estimated_delivery type issue */}
        {order.estimated_delivery && (
          <div className="rounded-lg border bg-green-50 border-green-200 px-5 py-4 flex items-center gap-3">
            <PackageCheck className="text-green-600 shrink-0" size={22} />
            <div>
              <p className="text-sm font-medium text-green-900">Estimated Delivery</p>
              {/* @ts-ignore - estimated_delivery type issue */}
              <p className="text-sm text-green-800">{order.estimated_delivery}</p>
            </div>
          </div>
        )}

        {/* ── Order summary ───────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Order Summary
          </h2>
          <OrderItemsTable order={order} />
        </div>

        {/* ── Shipping + Payment info side by side ────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Shipping address */}
          <div className="rounded-lg border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin size={15} className="text-muted-foreground" />
              Shipping To
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground">
                {order.shipping_address.full_name}
              </p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.province}</p>
              {order.shipping_address.postal_code && <p>{order.shipping_address.postal_code}</p>}
              <p>{order.shipping_address.phone}</p>
              {order.is_discreet && (
                <Badge variant="outline" className="mt-1 text-xs border-blue-200 bg-blue-50 text-blue-700">
                  Discreet packaging
                </Badge>
              )}
            </div>
          </div>

          {/* Payment info */}
          <div className="rounded-lg border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              {order.payment_method === 'cod'
                ? <Banknote size={15} className="text-muted-foreground" />
                : <CreditCard size={15} className="text-muted-foreground" />
              }
              Payment
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Method</span>
                <span className="font-medium text-foreground">{order.payment_method_display}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <Badge
                  variant="outline"
                  className={cn('text-xs', PAYMENT_BADGE[order.payment_status])}
                >
                  {order.payment_status_display}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Placed</span>
                <span className="font-medium text-foreground text-xs">
                  {formatDate(order.created_at)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Notes ──────────────────────────────────────────────────── */}
        {order.notes && (
          <div className="rounded-lg border bg-muted/30 px-5 py-4 text-sm">
            <p className="font-medium mb-1">Order Notes</p>
            <p className="text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {/* ── CTA buttons ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href={`/account/orders/${order.id}`}>
              <PackageCheck className="mr-2 h-4 w-4" />
              Track Order
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/products">
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          A confirmation email has been sent to your registered email address.
          <br />
          Questions? Contact us at{' '}
          <a href="mailto:support@luxemarket.pk" className="underline underline-offset-2">
            support@luxemarket.pk
          </a>
        </p>

      </main>
    </div>
  );
}