// ============================================================
// types/cart.ts
// Based on: cart/serializers.py (Redis-backed cart)
// Note: Cart Django model nahi hai — Redis dict hai
//       isliye sab fields optional nahi, direct values hain
// ============================================================

// ----------------------------------------------------------
// Cart Item — single item inside cart's items list
// ----------------------------------------------------------

export interface CartItem {
  cart_item_id: string;              // UUID — har item ka unique id
  product_id: string;                // UUID
  variant_id: string | null;         // UUID — null agar no variant
  name: string;
  image: string;                     // absolute URL (allow_blank → "")
  price: string;                     // DRF Decimal → string
  quantity: number;
  size: string;                      // allow_blank → "" agar no size
  color: string;                     // allow_blank → "" agar no color
}

// ----------------------------------------------------------
// Cart Summary — financial breakdown
// ----------------------------------------------------------

export interface CartSummary {
  subtotal: string;                  // DRF Decimal → string
  discount_amount: string;           // DRF Decimal → string
  shipping: string;                  // DRF Decimal → string
  total: string;                     // DRF Decimal → string
}

// ----------------------------------------------------------
// Full Cart — GET /api/cart/ ka response
// ----------------------------------------------------------

export interface Cart {
  items: CartItem[];
  coupon_code: string | null;        // null agar koi coupon apply nahi
  discount_amount: string;           // DRF Decimal → string (default "0")
  summary: CartSummary;              // computed — nested object
}

// ----------------------------------------------------------
// Cart Action Payloads — POST/PATCH/DELETE request bodies
// ----------------------------------------------------------

// Item add karne k liye
export interface AddToCartPayload {
  product_id: string;                // UUID
  variant_id?: string;               // UUID — optional
  quantity: number;
}

// Quantity update karne k liye
export interface UpdateCartItemPayload {
  cart_item_id: string;              // UUID
  quantity: number;
}

// Single item remove karne k liye
export interface RemoveCartItemPayload {
  cart_item_id: string;              // UUID
}