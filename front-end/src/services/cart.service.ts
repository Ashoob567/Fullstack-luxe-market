/**
 * Cart API Service
 *
 * Handles all cart operations with the Django backend.
 * Uses typed API helpers from @/lib/api for consistent error handling.
 */

import { get, post, put, del } from '@/lib/api';
import type { Cart, AddToCartPayload, UpdateCartItemPayload } from '@/types/cart';

const CART_BASE = '/api/cart';

export interface CartApiResponse {
  items: Array<{
    cart_item_id: string;
    product_id: string;
    variant_id: string;
    name: string;
    image: string;
    price: string;
    quantity: number;
    size: string;
    color: string;
  }>;
  coupon_code: string | null;
  discount_amount: string;
  summary: {
    subtotal: string;
    discount_amount: string;
    shipping: string;
    total: string;
  };
}

export interface AddToCartRequest {
  product_id: string;
  variant_id: string;
  quantity: number;
}

export interface UpdateCartRequest {
  quantity: number;
}

export const cartService = {
  /**
   * Fetch the complete cart from backend
   */
  async getCart(): Promise<CartApiResponse> {
    return get<CartApiResponse>(`${CART_BASE}/`);
  },

  /**
   * Add item to cart (or increment quantity if exists)
   */
  async addToCart(payload: AddToCartRequest): Promise<CartApiResponse> {
    return post<CartApiResponse>(`${CART_BASE}/add/`, payload);
  },

  /**
   * Update item quantity
   */
  async updateCartItem(cartItemId: string, quantity: number): Promise<CartApiResponse> {
    return put<CartApiResponse>(`${CART_BASE}/update/${cartItemId}/`, { quantity });
  },

  /**
   * Remove single item from cart
   */
  async removeCartItem(cartItemId: string): Promise<CartApiResponse> {
    return del<CartApiResponse>(`${CART_BASE}/remove/${cartItemId}/`);
  },

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<{ cleared: boolean }> {
    return del<{ cleared: boolean }>(`${CART_BASE}/clear/`);
  },

  /**
   * Apply coupon code
   */
  async applyCoupon(couponCode: string): Promise<CartApiResponse> {
    return post<CartApiResponse>(`${CART_BASE}/coupon/`, { coupon_code: couponCode });
  },

  /**
   * Remove applied coupon
   */
  async removeCoupon(): Promise<CartApiResponse> {
    return del<CartApiResponse>(`${CART_BASE}/coupon/remove/`);
  },

  /**
   * Merge guest cart into user cart (on login)
   */
  async mergeCart(guestKey?: string): Promise<CartApiResponse> {
    return post<CartApiResponse>(`${CART_BASE}/merge/`, { guest_key: guestKey });
  },
};
