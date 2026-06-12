'use client';

// src/app/(shop)/order-track/page.tsx
//
// Guest order tracking page.
// Calls GET /api/orders/track/?email=<email>&order_id=<uuid>
// No authentication required — matches email + order_id as a simple secret.

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Search, PackageCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { GuestOrderTrackResponse } from '@/types';

const trackSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  order_id: z.string().min(1, 'Order ID is required'),
});

type TrackFormData = z.infer<typeof trackSchema>;

const STATUS_BADGE: Record<string, string> = {
  pending:   'border-yellow-300 bg-yellow-50 text-yellow-800',
  confirmed: 'border-blue-300 bg-blue-50 text-blue-800',
  shipped:   'border-purple-300 bg-purple-50 text-purple-800',
  delivered: 'border-green-300 bg-green-50 text-green-800',
  cancelled: 'border-red-300 bg-red-50 text-red-800',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

export default function OrderTrackPage() {
  const [result,    setResult]    = useState<GuestOrderTrackResponse | null>(null);
  const [notFound,  setNotFound]  = useState(false);
  const [searching, setSearching] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackFormData>({
    resolver: zodResolver(trackSchema),
  });

  const onSubmit = async (data: TrackFormData) => {
    setSearching(true);
    setResult(null);
    setNotFound(false);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const params  = new URLSearchParams({ email: data.email, order_id: data.order_id });
      const res     = await fetch(`${API_URL}/api/orders/track/?${params}`);

      if (res.status === 404) {
        setNotFound(true);
        return;
      }

      if (!res.ok) throw new Error('Unexpected error');

      const json: GuestOrderTrackResponse = await res.json();
      setResult(json);
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/" className="font-bold text-lg tracking-tight">Luxe Market</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Title */}
        <div className="text-center space-y-2">
          <PackageCheck className="mx-auto text-muted-foreground" size={40} />
          <h1 className="text-2xl font-bold tracking-tight">Track Your Order</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address and order ID to check your order status.
          </p>
        </div>

        {/* Search form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_id">Order ID</Label>
                <Input
                  id="order_id"
                  placeholder="e.g. a1b2c3d4-..."
                  {...register('order_id')}
                />
                {errors.order_id && (
                  <p className="text-sm text-destructive">{errors.order_id.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={searching}>
                {searching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track Order
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Not found */}
        {notFound && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="pt-6 text-center text-sm text-destructive">
              <p className="font-medium">Order not found.</p>
              <p className="text-muted-foreground mt-1">
                Please check your email address and order ID and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-mono">{result.order_number}</CardTitle>
                <Badge
                  variant="outline"
                  className={cn('text-xs', STATUS_BADGE[result.status])}
                >
                  {result.status_display}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span>{result.payment_method_display}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">
                  {result.currency} {parseFloat(result.total_amount).toLocaleString('en-PK')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{result.item_count} item{result.item_count !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping to</span>
                <span>{result.shipping_city}, {result.shipping_province}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Placed on</span>
                <span>{formatDate(result.created_at)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Estimated Delivery</span>
                <span className="text-green-700">{result.estimated_delivery}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer link */}
        <p className="text-center text-xs text-muted-foreground">
          Have an account?{' '}
          <Link href="/login" className="underline underline-offset-2">
            Sign in
          </Link>{' '}
          to view full order details.
        </p>

      </main>
    </div>
  );
}
