// ============================================================
// services/wishlistService.ts
// ============================================================

import api from "@/lib/api";
import {
  WishlistItem,
  WishlistTogglePayload,
  WishlistToggleResponse,
  WishlistBulkStatusPayload,
  WishlistBulkStatusResponse,
} from "@/types";

export const getWishlist = async (): Promise<WishlistItem[]> => {
  const { data } = await api.get("/api/wishlist/");
  return data;
};

export const toggleWishlist = async (
  payload: WishlistTogglePayload
): Promise<WishlistToggleResponse> => {
  const { data } = await api.post<WishlistToggleResponse>(
    "/api/wishlist/toggle/",
    payload
  );
  return data;
};

export const getBulkWishlistStatus = async (
  payload: WishlistBulkStatusPayload
): Promise<WishlistBulkStatusResponse> => {
  const { data } = await api.post<WishlistBulkStatusResponse>(
    "/api/wishlist/bulk-status/",
    payload
  );
  return data;
};