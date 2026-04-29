import { create } from 'zustand';
import { CartItem } from '@/types/order';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  totalItems: number;
  totalPrice: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (newItem) => {
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex(
      (item) => item.variantId === newItem.variantId
    );

    if (existingIndex >= 0) {
      const updatedItems = [...currentItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + newItem.quantity,
      };
      set({ items: updatedItems });
    } else {
      set({ items: [...currentItems, newItem] });
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(get().items));
    }
  },

  removeItem: (variantId) => {
    const updatedItems = get().items.filter((item) => item.variantId !== variantId);
    set({ items: updatedItems });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(updatedItems));
    }
  },

  updateQuantity: (variantId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(variantId);
      return;
    }
    const updatedItems = get().items.map((item) =>
      item.variantId === variantId ? { ...item, quantity } : item
    );
    set({ items: updatedItems });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(updatedItems));
    }
  },

  clearCart: () => {
    set({ items: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
    }
  },

  toggleDrawer: () => set({ isOpen: !get().isOpen }),
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),

  get totalItems() {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  get totalPrice() {
    return get().items.reduce((sum, item) => {
      const price = item.salePrice ?? item.price;
      return sum + price * item.quantity;
    }, 0);
  },
}));

// Initialize cart from localStorage on client side
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
