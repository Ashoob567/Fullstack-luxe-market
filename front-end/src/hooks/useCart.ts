import { useCartStore } from '@/store/cartStore';
import { CartItem } from '@/types/order';

export function useCart() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const toggleDrawer = useCartStore((state) => state.toggleDrawer);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const totalItems = useCartStore((state) => state.totalItems);
  const totalPrice = useCartStore((state) => state.totalPrice);

  const getItemQuantity = (variantId: number) => {
    const item = items.find((i) => i.variantId === variantId);
    return item?.quantity ?? 0;
  };

  const isInCart = (variantId: number) => {
    return items.some((i) => i.variantId === variantId);
  };

  return {
    items,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleDrawer,
    openDrawer,
    closeDrawer,
    totalItems,
    totalPrice,
    getItemQuantity,
    isInCart,
  };
}
