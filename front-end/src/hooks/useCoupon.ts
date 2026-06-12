// ============================================================
// hooks/useCoupon.ts
// ============================================================

import { useState } from "react";
import { validateCoupon } from "@/services/couponService";
import { parseApiError } from "@/lib/utils";
import { CouponResponse } from "@/types";

// ----------------------------------------------------------
// useCoupon — cart/checkout mein coupon apply karne k liye
// ----------------------------------------------------------

export const useCoupon = () => {
  const [coupon, setCoupon]       = useState<CouponResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleValidate = async (code: string, cartTotal: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await validateCoupon({
        code,
        cart_total: cartTotal.toString(),
      });
      setCoupon(result);
    } catch (err) {
      setError(parseApiError(err));
      setCoupon(null);
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setError(null);
  };

  return { coupon, isLoading, error, handleValidate, removeCoupon };
};