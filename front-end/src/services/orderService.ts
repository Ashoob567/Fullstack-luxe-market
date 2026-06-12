// ============================================================
// services/orderService.ts
// ============================================================

import api from "@/lib/api";
import {
  PaginatedResponse,
  Order,
  OrderSummary,
  GuestOrderTrack,
  ShippingAddress,
} from "@/types";

export interface PlaceOrderPayload {
  payment_method:   string;
  shipping_address: ShippingAddress;
  coupon_code?:     string;
  is_discreet?:     boolean;
  notes?:           string;
}

export const getOrders = async (): Promise<PaginatedResponse<OrderSummary>> => {
  const { data } = await api.get("/orders/");
  return data;
};

export const getOrderDetail = async (id: string): Promise<Order> => {
  const { data } = await api.get<Order>(`/orders/${id}/`);
  return data;
};

export const placeOrder = async (payload: PlaceOrderPayload): Promise<Order> => {
  const { data } = await api.post<Order>("/orders/", payload);
  return data;
};

export const cancelOrder = async (id: string): Promise<Order> => {
  const { data } = await api.post<Order>(`/orders/${id}/cancel/`);
  return data;
};

export const trackGuestOrder = async (
  orderNumber: string
): Promise<GuestOrderTrack> => {
  const { data } = await api.get<GuestOrderTrack>(
    `/orders/track/${orderNumber}/`
  );
  return data;
};