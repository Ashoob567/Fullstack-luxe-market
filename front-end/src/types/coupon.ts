// ============================================================
// types/coupon.ts
// Based on: coupons/serializers.py
// ============================================================

// ----------------------------------------------------------
// Coupon Validate (POST request body)
// ----------------------------------------------------------

export interface CouponValidatePayload {
  code: string;                      // e.g. "SAVE20"
  cart_total: string | number;       // DecimalField — string bhejnaa safe hai
}

// ----------------------------------------------------------
// Coupon Response (POST response — successful validation)
// ----------------------------------------------------------

export type CouponDiscountType = "percentage" | "fixed";

export interface CouponResponse {
  code: string;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: string;            // DRF Decimal → string
  max_discount_amount: string | null;// DRF Decimal → string
  min_order_value: string | null;    // DRF Decimal → string
  discount_amount: string;           // computed — kitna discount milega
  final_total: string;               // computed — cart_total - discount
  validity_message: string;          // e.g. "Expires in 3 days"
  valid_until: string;               // ISO datetime string
}

// ----------------------------------------------------------
// Coupon Usage (Admin view)
// ----------------------------------------------------------

export interface CouponUsage {
  id: string;                        // UUID
  coupon_code: string;
  user_email: string;
  order_id: string | null;           // UUID
  discount_applied: string;          // DRF Decimal → string
  used_at: string;                   // ISO datetime string
}