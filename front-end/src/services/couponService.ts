// ============================================================
// services/couponService.ts
// ============================================================

import api from "@/lib/api";
import { CouponValidatePayload, CouponResponse } from "@/types";

export const validateCoupon = async (
  payload: CouponValidatePayload
): Promise<CouponResponse> => {
  const { data } = await api.post<CouponResponse>("/coupons/validate/", payload);
  return data;
};