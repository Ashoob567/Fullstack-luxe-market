/**
 * Cart Store - Optimized with Backend Sync
 *
 * Architecture:
 * - Optimistic updates for instant UI feedback
 * - Rollback on backend failure
 * - localStorage persistence for offline support
 * - Dual-layer: localStorage (primary) + Redis backend (sync)
 * - Guest cart: localStorage only
 * - Authenticated cart: synced with backend Redis
 */

import { create } from 'zustand';
import { cartService, type CartApiResponse } from '@/services/cart.service';
import type { CartItem } from '@/types';

interface CartState {
  // State
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastError: string | null;

  // Actions
  addItem: (item: Omit<CartItem, 'cart_item_id'>) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithBackend: () => Promise<void>;

  // Drawer
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  // Computed
  totalItems: number;
  totalPrice: number;

  // Internal
  _setItems: (items: CartItem[]) => void;
  _setLoading: (loading: boolean) => void;
  _setSyncing: (syncing: boolean) => void;
  _setError: (error: string | null) => void;
}

// Helper: Save to localStorage
function saveToLocalStorage(items: CartItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart', JSON.stringify(items));
  }
}

// Helper: Check if user is authenticated
function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

// Helper: Transform backend response to CartItem[]
function transformBackendToCartItems(response: CartApiResponse): CartItem[] {
  return response.items.map((item) => ({
    cart_item_id: item.cart_item_id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
  }));
}

export const useCartStore = create<CartState>((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────
  items: [],
  isOpen: false,
  isLoading: false,
  isSyncing: false,
  lastError: null,

  // ── Add Item ───────────────────────────────────────────────────────
  addItem: async (newItem) => {
    const state = get();
    const existingIndex = state.items.findIndex(
      (item) => item.variant_id === newItem.variant_id
    );

    // Generate temporary cart_item_id for optimistic update
    const tempCartItemId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Optimistic update
    let optimisticItems: CartItem[];
    if (existingIndex >= 0) {
      optimisticItems = [...state.items];
      optimisticItems[existingIndex] = {
        ...optimisticItems[existingIndex],
        quantity: optimisticItems[existingIndex].quantity + newItem.quantity,
      };
    } else {
      optimisticItems = [
        ...state.items,
        { ...newItem, cart_item_id: tempCartItemId } as CartItem,
      ];
    }

    set({ items: optimisticItems, lastError: null });
    saveToLocalStorage(optimisticItems);

    // Backend sync (if authenticated)
    if (isAuthenticated()) {
      set({ isSyncing: true });
      try {
        const response = await cartService.addToCart({
          product_id: newItem.product_id,
          variant_id: newItem.variant_id || '',
          quantity: newItem.quantity,
        });

        const backendItems = transformBackendToCartItems(response);
        set({ items: backendItems, isSyncing: false });
        saveToLocalStorage(backendItems);
      } catch (error: any) {
        console.error('[CartStore] Add item failed:', error);

        // Rollback on failure
        set({
          items: state.items,
          isSyncing: false,
          lastError: error.response?.data?.error || 'Failed to add item to cart'
        });
        saveToLocalStorage(state.items);
        throw error;
      }
    }
  },

  // ── Remove Item ────────────────────────────────────────────────────
  removeItem: async (cartItemId) => {
    const state = get();

    // Optimistic update
    const optimisticItems = state.items.filter((item) => item.cart_item_id !== cartItemId);
    set({ items: optimisticItems, lastError: null });
    saveToLocalStorage(optimisticItems);

    // Backend sync (if authenticated)
    if (isAuthenticated()) {
      set({ isSyncing: true });
      try {
        const response = await cartService.removeCartItem(cartItemId);
        const backendItems = transformBackendToCartItems(response);
        set({ items: backendItems, isSyncing: false });
        saveToLocalStorage(backendItems);
      } catch (error: any) {
        console.error('[CartStore] Remove item failed:', error);

        // Rollback on failure
        set({
          items: state.items,
          isSyncing: false,
          lastError: 'Failed to remove item'
        });
        saveToLocalStorage(state.items);
        throw error;
      }
    }
  },

  // ── Update Quantity ────────────────────────────────────────────────
  updateQuantity: async (cartItemId, quantity) => {
    if (quantity <= 0) {
      return get().removeItem(cartItemId);
    }

    const state = get();

    // Optimistic update
    const optimisticItems = state.items.map((item) =>
      item.cart_item_id === cartItemId ? { ...item, quantity } : item
    );
    set({ items: optimisticItems, lastError: null });
    saveToLocalStorage(optimisticItems);

    // Backend sync (if authenticated)
    if (isAuthenticated()) {
      set({ isSyncing: true });
      try {
        const response = await cartService.updateCartItem(cartItemId, quantity);
        const backendItems = transformBackendToCartItems(response);
        set({ items: backendItems, isSyncing: false });
        saveToLocalStorage(backendItems);
      } catch (error: any) {
        console.error('[CartStore] Update quantity failed:', error);

        // Rollback on failure
        set({
          items: state.items,
          isSyncing: false,
          lastError: 'Failed to update quantity'
        });
        saveToLocalStorage(state.items);
        throw error;
      }
    }
  },

  // ── Clear Cart ─────────────────────────────────────────────────────
  clearCart: async () => {
    const state = get();

    // Optimistic update
    set({ items: [], lastError: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
    }

    // Backend sync (if authenticated)
    if (isAuthenticated()) {
      set({ isSyncing: true });
      try {
        await cartService.clearCart();
        set({ isSyncing: false });
      } catch (error: any) {
        console.error('[CartStore] Clear cart failed:', error);

        // Rollback on failure
        set({
          items: state.items,
          isSyncing: false,
          lastError: 'Failed to clear cart'
        });
        saveToLocalStorage(state.items);
        throw error;
      }
    }
  },

  // ── Sync with Backend ──────────────────────────────────────────────
  syncWithBackend: async () => {
    if (!isAuthenticated()) return;

    set({ isLoading: true, lastError: null });
    try {
      const response = await cartService.getCart();
      const backendItems = transformBackendToCartItems(response);
      set({ items: backendItems, isLoading: false });
      saveToLocalStorage(backendItems);
    } catch (error: any) {
      console.error('[CartStore] Sync failed:', error);
      set({
        isLoading: false,
        lastError: 'Failed to sync cart'
      });
    }
  },

  // ── Drawer Actions ─────────────────────────────────────────────────
  toggleDrawer: () => set({ isOpen: !get().isOpen }),
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),

  // ── Computed Properties ────────────────────────────────────────────
  get totalItems() {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  get totalPrice() {
    return get().items.reduce((sum, item) => {
      const price = Number(item.price ?? 0);
      return sum + price * item.quantity;
    }, 0);
  },

  // ── Internal Setters ───────────────────────────────────────────────
  _setItems: (items) => {
    set({ items });
    saveToLocalStorage(items);
  },
  _setLoading: (loading) => set({ isLoading: loading }),
  _setSyncing: (syncing) => set({ isSyncing: syncing }),
  _setError: (error) => set({ lastError: error }),
}));

// ── Initialize from localStorage ──────────────────────────────────────
if (typeof window !== 'undefined') {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      const items = JSON.parse(savedCart) as CartItem[];
      useCartStore.setState({ items });
    } catch {
      localStorage.removeItem('cart');
    }
  }
}
