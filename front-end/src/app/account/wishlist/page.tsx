'use client';

import { useEffect, useState } from 'react';
import { getWishlist } from '@/services/wishlistService';
import { ProductCardV2 } from '@/components/products/ProductCardV2';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/hooks/useWishlistStore';
import { Heart } from 'lucide-react';
import type { WishlistItem, ProductList } from '@/types';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [guestProducts, setGuestProducts] = useState<ProductList[]>([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const guestItems = useWishlistStore((state) => state.guestItems);

  useEffect(() => {
    if (!isAuthenticated) {
      // Guest mode - fetch full product data using the list endpoint with ids filter
      setLoading(true);
      console.log('[WishlistPage] Guest mode - guestItems:', guestItems);

      const fetchGuestProducts = async () => {
        try {
          console.log('[WishlistPage] Fetching products for', guestItems.length, 'items');

          // Use the list endpoint with ids filter (comma-separated product IDs)
          const ids = guestItems.map((item) => item.id).join(',');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/?ids=${ids}`);

          if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
          }

          const data = await response.json();
          console.log('[WishlistPage] Fetched products:', data.results);
          setGuestProducts(data.results || []);
        } catch (error) {
          console.error('Failed to fetch guest wishlist products:', error);
          setGuestProducts([]);
        } finally {
          setLoading(false);
        }
      };

      if (guestItems.length > 0) {
        fetchGuestProducts();
      } else {
        console.log('[WishlistPage] No guest items to fetch');
        setLoading(false);
      }
      return;
    }

    // Authenticated mode - fetch from backend
    console.log('[WishlistPage] Authenticated mode - fetching from backend');
    getWishlist()
      .then((items) => setWishlistItems(items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, guestItems]);

  if (loading) {
    return (
      <div className="container py-8 min-h-screen">
        <div className="h-10 w-64 rounded-lg bg-muted animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border bg-card overflow-hidden">
              <div className="aspect-square w-full bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-5 w-24 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Check if wishlist is empty
  const itemCount = isAuthenticated ? wishlistItems.length : guestProducts.length;

  if (itemCount === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          title={isAuthenticated ? "Your wishlist is empty" : "Your wishlist is empty"}
          description={isAuthenticated
            ? "Save products you love to your wishlist"
            : "Save products you love (login to sync across devices)"}
          actionText="Browse Products"
          onAction={() => (window.location.href = '/products')}
          icon={<Heart className="h-12 w-12 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="container py-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          My Wishlist ({itemCount})
        </h1>
        {!isAuthenticated && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border">
            <Heart size={16} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Login to sync your wishlist across devices
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isAuthenticated ? (
          // Authenticated: Show backend wishlist with full product details
          wishlistItems.map((item) => (
            <ProductCardV2 key={item.id} product={item.product} />
          ))
        ) : (
          // Guest: Show full product cards with fetched data
          guestProducts.map((product) => (
            <ProductCardV2 key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
}
