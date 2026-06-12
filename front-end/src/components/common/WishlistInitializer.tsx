'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';
import { getWishlist } from '@/services/wishlistService';

export function WishlistInitializer() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initializeWishlist = useWishlistStore((state) => state.initializeWishlist);
  const initializeGuestWishlist = useWishlistStore((state) => state.initializeGuestWishlist);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const isInitialized = useWishlistStore((state) => state.isInitialized);

  useEffect(() => {
    // Only initialize once
    if (isInitialized) return;

    if (isAuthenticated) {
      // Fetch wishlist from backend when user is authenticated
      getWishlist()
        .then((items) => {
          const productIds = items.map((item) => item.product.id);
          initializeWishlist(productIds);
        })
        .catch((error) => {
          console.error('Failed to load wishlist:', error);
          // Initialize with empty wishlist on error
          initializeWishlist([]);
        });
    } else {
      // Load guest wishlist from localStorage
      initializeGuestWishlist();
    }
  }, [isAuthenticated, initializeWishlist, initializeGuestWishlist, isInitialized]);

  // Handle authentication state changes
  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      // User logged out - switch to guest mode
      initializeGuestWishlist();
    } else {
      // User logged in - load from backend
      getWishlist()
        .then((items) => {
          const productIds = items.map((item) => item.product.id);
          initializeWishlist(productIds);
        })
        .catch((error) => {
          console.error('Failed to load wishlist after login:', error);
        });
    }
  }, [isAuthenticated, initializeWishlist, initializeGuestWishlist, isInitialized]);

  return null;
}
