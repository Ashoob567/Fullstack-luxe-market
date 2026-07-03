import { post } from "./api";

export interface SendOTPRequest {
  contact: string;
  contact_type: "email" | "phone";
}

/**
 * Timing constants from server (authoritative - never hardcode in UI).
 */
export interface SendOTPResponse {
  message: string;
  otp_expires_in_seconds: number;
  resend_available_in_seconds: number;
}

export interface VerifyAndCreateOrderRequest {
  contact: string;
  contact_type: "email" | "phone";
  otp: string;
  idempotency_key: string;
  order_data: {
    shipping_address: Record<string, unknown>;
    payment_method: string;
    card_number?: string;  // Re-entered at verify time
    is_discreet: boolean;
    notes?: string;
    cart_id?: string;
    cart_items?: unknown[];
  };
}

export interface VerifyAndCreateOrderResponse {
  status: "success" | "failed";
  order_id?: string;
  order_number?: string;
  order_summary?: Record<string, unknown>;
  // Error fields
  error?: string;
  detail?: string;
  verified?: boolean;
  reason?: string;
  attempts_remaining?: number;
}

export async function sendOTP(data: SendOTPRequest): Promise<SendOTPResponse> {
  return post<SendOTPResponse>("/api/payments/send-otp/", data);
}

export async function verifyAndCreateOrder(
  data: VerifyAndCreateOrderRequest
): Promise<VerifyAndCreateOrderResponse> {
  return post<VerifyAndCreateOrderResponse>(
    "/api/payments/verify-and-create-order/",
    data
  );
}
