// ============================================================
// types/wishlist.ts
// Based on: wishlist/serializers.py
// ============================================================

import { ProductList } from "./product";

// ----------------------------------------------------------
// Wishlist Item (GET response)
// ----------------------------------------------------------

export interface WishlistItem {
  id: string;                        // UUID
  product: ProductList;              // full product card object (nested)
  created_at: string;                // ISO datetime string
}

// ----------------------------------------------------------
// Toggle Wishlist (POST request body)
// ----------------------------------------------------------

export interface WishlistTogglePayload {
  product_id: string;                // UUID
}

// ----------------------------------------------------------
// Toggle Wishlist (POST response)
// ----------------------------------------------------------

export interface WishlistToggleResponse {
  action: "added" | "removed";       // backend returns "added" or "removed"
  product_id: string;
  message: string;
}

// ----------------------------------------------------------
// Bulk Status Check (POST request body)
// ----------------------------------------------------------

export interface WishlistBulkStatusPayload {
  product_ids: string[];             // UUID[] — max 100
}

// ----------------------------------------------------------
// Bulk Status Check (POST response)
// e.g. { "uuid-1": true, "uuid-2": false }
// ----------------------------------------------------------

export interface WishlistBulkStatusResponse {
  wishlist_status: Record<string, boolean>;
}

// ----------------------------------------------------------
// Guest Wishlist Item (localStorage)
// ----------------------------------------------------------

export interface GuestWishlistItem {
  id: string;                        // Product UUID
  name: string;
  price: string;
  image: string;
  slug: string;
  category: string;
}
