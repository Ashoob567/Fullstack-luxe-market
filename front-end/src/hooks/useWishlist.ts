import { useState, useEffect } from 'react';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>([]);
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

  const addToWishlist = (productId: number) => {
    if (!wishlist.includes(productId)) {
      const updated = [...wishlist, productId];
      setWishlist(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist', JSON.stringify(updated));
      }
    }
  };

  const removeFromWishlist = (productId: number) => {
    const updated = wishlist.filter((id) => id !== productId);
    setWishlist(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(updated));
    }
  };

  const isInWishlist = (productId: number) => {
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
