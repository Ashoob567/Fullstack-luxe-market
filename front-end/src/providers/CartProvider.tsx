'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';

interface CartProviderProps {
  children: React.ReactNode;
}

/**
 * CartProvider - Initializes cart from backend on mount
 *
 * Responsibilities:
 * - Sync cart with backend on initial load (authenticated users only)
 * - Merge guest cart with user cart on login
 * - Handle cart persistence across page refreshes
 */
export function CartProvider({ children }: CartProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const syncWithBackend = useCartStore((s) => s.syncWithBackend);

  useEffect(() => {
    // Only run once on mount
    if (isInitialized) return;

    const initializeCart = async () => {
      // Check if user is authenticated
      const accessToken = localStorage.getItem('accessToken');

      if (accessToken) {
        // Authenticated user: sync with backend Redis cart
        try {
          await syncWithBackend();
        } catch (error) {
          console.error('[CartProvider] Failed to sync cart:', error);
        }
      } else {
        // Guest user: use localStorage cart only
        console.log('[CartProvider] Guest mode - using localStorage cart');
      }

      setIsInitialized(true);
    };

    initializeCart();
  }, [isInitialized, syncWithBackend]);

  // Listen for auth changes (login/logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        if (e.newValue) {
          // User logged in - sync cart
          syncWithBackend();
        } else {
          // User logged out - keep localStorage cart but clear backend ref
          console.log('[CartProvider] User logged out');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncWithBackend]);

  return <>{children}</>;
}
