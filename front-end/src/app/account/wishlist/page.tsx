'use client';

import { useEffect, useState } from 'react';
import { get } from '@/lib/api';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/products/ProductCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useWishlist } from '@/hooks/useWishlist';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, isLoaded } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || wishlist.length === 0) {
      setLoading(false);
      return;
    }

    const ids = wishlist.join(',');
    get<{ results: Product[] }>(`/api/products/?ids=${ids}`)
      .then((data) => setProducts(data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wishlist, isLoaded]);

  if (!isLoaded || loading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-square w-full rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container py-16">
        <EmptyState
          title="Your wishlist is empty"
          description="Save products you love to your wishlist"
          actionText="Browse Products"
          onAction={() => (window.location.href = '/products')}
          icon={<Heart className="h-12 w-12 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
