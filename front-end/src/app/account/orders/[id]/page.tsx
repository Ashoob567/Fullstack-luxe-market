'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { get } from '@/lib/api';
import { Order } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { formatPrice, formatDate } from '@/lib/utils';
import Image from 'next/image';

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<Order>(`/api/orders/${params.id}/`)
      .then((data) => setOrder(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">Order not found</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Breadcrumb
        items={[
          { label: 'Account', href: '/account' },
          { label: 'Orders', href: '/account/orders' },
          { label: `Order #${order.order_number}` },
        ]}
      />

      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Items</CardTitle>
                <Badge>{order.status_display ?? order.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-20 w-20 rounded-md bg-muted overflow-hidden">
                    <Image
                      src={`/placeholder-product.jpg`}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    {/* ✅ item.name (was item.productName) */}
                    <h4 className="font-medium">{item.name}</h4>
                    {/* ✅ item.unit_price (was item.price) — string, parse to number */}
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {formatPrice(parseFloat(item.unit_price))}
                    </p>
                    {/* ✅ item.variant.size (was item.size) */}
                    {item.variant?.size && (
                      <p className="text-xs text-muted-foreground">Size: {item.variant.size}</p>
                    )}
                    {/* ✅ item.variant.color (was item.color) */}
                    {item.variant?.color && (
                      <p className="text-xs text-muted-foreground">Color: {item.variant.color}</p>
                    )}
                  </div>
                  {/* ✅ item.subtotal (string) — parse to number */}
                  <p className="font-medium">{formatPrice(parseFloat(item.subtotal))}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                {/* ✅ order.subtotal is a string — parse to number */}
                <span>{formatPrice(parseFloat(order.subtotal))}</span>
              </div>
              {parseFloat(order.discount_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>−{formatPrice(parseFloat(order.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                {/* ✅ order.shipping_amount (was order.shippingCost) */}
                <span>{formatPrice(parseFloat(order.shipping_amount))}</span>
              </div>
              {/* ✅ order.tax removed — field doesn't exist in model */}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                {/* ✅ order.total_amount (was order.total) */}
                <span>{formatPrice(parseFloat(order.total_amount))}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {/* ✅ order.shipping_address (was order.shippingAddress) */}
              <p>{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
              {/* ✅ order.shipping_address.streetAddress (was addressLine1) */}
              <p>{order.shipping_address.streetAddress}</p>
              {/* ✅ addressLine2 removed — doesn't exist in model */}
              {/* ✅ order.shipping_address.province (was state) */}
              <p>{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postalCode}</p>
              {/* ✅ country removed — doesn't exist in model */}
              <p>{order.shipping_address.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date</span>
                {/* ✅ order.created_at (was order.createdAt) */}
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                {/* ✅ order.payment_method (was order.paymentMethod) */}
                <span className="uppercase">{order.payment_method_display ?? order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                {/* ✅ order.payment_status (was order.paymentStatus) */}
                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {order.payment_status_display ?? order.payment_status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
