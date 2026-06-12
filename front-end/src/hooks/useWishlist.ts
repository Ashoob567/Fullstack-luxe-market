import { useState, useEffect } from 'react';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        try {
          setWishlist(JSON.parse(saved));
        } catch {
          localStorage.removeItem('wishlist');
        }
      }
      setIsLoaded(true);
    }
  }, []);

  const addToWishlist = (productId: string) => {
    if (!wishlist.includes(productId)) {
      const updated = [...wishlist, productId];
      setWishlist(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist', JSON.stringify(updated));
      }
    }
  };

  const removeFromWishlist = (productId: string) => {
    const updated = wishlist.filter((id) => id !== productId);
    setWishlist(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(updated));
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wishlist');
    }
  };

  return {
    wishlist,
    isLoaded,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  };
}
