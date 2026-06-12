// ============================================================
// types/order.ts
// Based on: orders/serializers.py
// ============================================================

// ----------------------------------------------------------
// Status & Payment enums
// ----------------------------------------------------------

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentMethod =
  | "cod"                            // Cash on Delivery
  | "card"
  | "bank_transfer"
  | "easypaisa"
  | "jazzcash";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

// ----------------------------------------------------------
// Shipping Address (JSON field)
// ----------------------------------------------------------

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code?: string;
  country?: string;
}

// ----------------------------------------------------------
// Order Item (line item — nested inside Order)
// ----------------------------------------------------------

export interface OrderItem {
  id: string;                        // UUID
  product_id: string;                // UUID
  variant_id: string | null;         // UUID
  name: string;                      // snapshot — product_name_snapshot
  variant: Record<string, string> | null; // snapshot — variant_info_snapshot (JSONField)
  unit_price: string;                // DRF Decimal → string
  quantity: number;
  subtotal: string;                  // DRF Decimal → string
}

// ----------------------------------------------------------
// Order Detail (full — with items)
// ----------------------------------------------------------

export interface Order {
  id: string;                        // UUID
  order_number: string;
  status: OrderStatus;
  status_display: string;            // human readable e.g. "Processing"
  payment_method: PaymentMethod;
  payment_method_display: string;
  payment_status: PaymentStatus;
  payment_status_display: string;
  subtotal: string;                  // DRF Decimal → string
  discount_amount: string;
  shipping_amount: string;
  total_amount: string;
  coupon_code: string | null;
  shipping_address: ShippingAddress;
  is_discreet: boolean;
  notes: string | null;
  created_at: string;                // ISO datetime string
  updated_at: string;
  is_cancellable: boolean;           // computed property
  display_amount: string;            // formatted e.g. "PKR 2,999"
  items: OrderItem[];                // nested
}

// ----------------------------------------------------------
// Order List (lightweight — no items)
// ----------------------------------------------------------

export interface OrderSummary extends Omit<Order, "items"> {}

// ----------------------------------------------------------
// Guest Order Tracking (public — limited fields)
// ----------------------------------------------------------

export interface GuestOrderTrack {
  order_number: string;
  status: OrderStatus;
  status_display: string;
  payment_method_display: string;
  payment_status: PaymentStatus;
  total_amount: string;
  currency: string;                  // always "PKR"
  created_at: string;
  shipping_city: string;             // extracted from shipping_address JSON
  shipping_province: string;
  item_count: number;
}