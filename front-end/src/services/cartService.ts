// ============================================================
// services/cartService.ts
// ============================================================

import api from "@/lib/api";
import { Cart, AddToCartPayload, UpdateCartItemPayload, RemoveCartItemPayload } from "@/types";

export const getCart = async (): Promise<Cart> => {
  const { data } = await api.get<Cart>("/cart/");
  return data;
};

export const addToCart = async (payload: AddToCartPayload): Promise<Cart> => {
  const { data } = await api.post<Cart>("/cart/add/", payload);
  return data;
};

export const updateCartItem = async (
  payload: UpdateCartItemPayload
): Promise<Cart> => {
  const { data } = await api.patch<Cart>("/cart/update/", payload);
  return data;
};

export const removeCartItem = async (
  payload: RemoveCartItemPayload
): Promise<Cart> => {
  const { data } = await api.delete<Cart>("/cart/remove/", { data: payload });
  return data;
};

export const clearCart = async (): Promise<void> => {
  await api.delete("/cart/clear/");
};