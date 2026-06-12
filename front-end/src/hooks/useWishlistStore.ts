import { create } from 'zustand';
import { toggleWishlist as toggleWishlistApi } from '@/services/wishlistService';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import type { GuestWishlistItem } from '@/types/wishlist';

const GUEST_WISHLIST_KEY = 'wishlist';
const MAX_GUEST_ITEMS = 20;

interface WishlistStore {
  // Wishlist state (product IDs for authenticated, full items for guest)
  wishlistIds: Set<string>;
  guestItems: GuestWishlistItem[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initializeWishlist: (productIds: string[]) => void;
  initializeGuestWishlist: () => void;
  toggleWishlist: (
    productId: string,
    productData?: {
      name: string;
      price: string;
      image: string;
      slug: string;
      category: string;
    }
  ) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  getGuestItems: () => GuestWishlistItem[];
}

// Helper functions for localStorage
const loadGuestWishlist = (): GuestWishlistItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!data) return [];
    const items = JSON.parse(data);
    return Array.isArray(items) ? items.slice(0, MAX_GUEST_ITEMS) : [];
  } catch (error) {
    console.error('Failed to load guest wishlist:', error);
    return [];
  }
};

const saveGuestWishlist = (items: GuestWishlistItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save guest wishlist:', error);
  }
};

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  wishlistIds: new Set<string>(),
  guestItems: [],
  isLoading: false,
  isInitialized: false,

  initializeWishlist: (productIds: string[]) => {
    set({ wishlistIds: new Set(productIds), isInitialized: true });
  },

  initializeGuestWishlist: () => {
    const items = loadGuestWishlist();
    const ids = new Set(items.map((item) => item.id));
    set({ guestItems: items, wishlistIds: ids, isInitialized: true });
  },

  toggleWishlist: async (productId: string, productData?) => {
    const { isAuthenticated } = useAuthStore.getState();
    const { wishlistIds, guestItems } = get();
    const wasInWishlist = wishlistIds.has(productId);

    // === GUEST MODE (localStorage) ===
    if (!isAuthenticated) {
      if (wasInWishlist) {
        // Remove from guest wishlist
        const newItems = guestItems.filter((item) => item.id !== productId);
        const newIds = new Set(newItems.map((item) => item.id));
        set({ guestItems: newItems, wishlistIds: newIds });
        saveGuestWishlist(newItems);
        toast.success('Removed from wishlist');
      } else {
        // Add to guest wishlist
        if (!productData) {
          toast.error('Product data required');
          return;
        }

        if (guestItems.length >= MAX_GUEST_ITEMS) {
          toast.error(`Wishlist is full (max ${MAX_GUEST_ITEMS} items for guests)`);
          return;
        }

        const newItem: GuestWishlistItem = {
          id: productId,
          name: productData.name,
          price: productData.price,
          image: productData.image,
          slug: productData.slug,
          category: productData.category,
        };

        const newItems = [...guestItems, newItem];
        const newIds = new Set(newItems.map((item) => item.id));
        set({ guestItems: newItems, wishlistIds: newIds });
        saveGuestWishlist(newItems);
        toast.success(`Added "${productData.name}" to wishlist`);
      }
      return;
    }

    // === AUTHENTICATED MODE (backend API) ===
    // Optimistic update
    const newWishlistIds = new Set(wishlistIds);
    if (wasInWishlist) {
      newWishlistIds.delete(productId);
    } else {
      newWishlistIds.add(productId);
    }
    set({ wishlistIds: newWishlistIds, isLoading: true });

    try {
      const response = await toggleWishlistApi({ product_id: productId });

      // Verify backend response matches optimistic update
      const isNowInWishlist = response.action === 'added';

      if (isNowInWishlist !== !wasInWishlist) {
        // Revert if backend disagrees
        set({ wishlistIds });
      }

      toast.success(response.message);
    } catch (error: any) {
      // Revert on error
      set({ wishlistIds });

      if (error.response?.status === 401) {
        toast.error('Please login to manage your wishlist');
      } else {
        toast.error('Failed to update wishlist. Please try again.');
      }
    } finally {
      set({ isLoading: false });
    }
  },

  isInWishlist: (productId: string) => {
    return get().wishlistIds.has(productId);
  },

  clearWishlist: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      // Clear guest wishlist
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_WISHLIST_KEY);
      }
      set({ wishlistIds: new Set(), guestItems: [] });
    } else {
      // For authenticated users, just clear local state
      // (backend clear should be done via API call separately)
      set({ wishlistIds: new Set() });
    }
  },

  getGuestItems: () => {
    return get().guestItems;
  },
}));
