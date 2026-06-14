'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';

import { getNewArrivals } from '@/services/productService';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ProductList, PaginatedResponse } from '@/types';

export default function NewArrivalsPage() {
  const [data, setData] = useState<PaginatedResponse<ProductList> | ProductList[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getNewArrivals();
        setData(result);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load new arrivals');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNewArrivals();
  }, []);

  // Filter to ensure only products with "new-arrival" tag are shown
  // Handle both array response and paginated response
  const allProducts = Array.isArray(data) ? data : (data?.results ?? []);
  const products = allProducts.filter(product =>
    product.tags?.some(tag => tag.slug === 'new-arrival')
  );

  // ── Loading skeleton ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-tertiary to-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-4 w-32 rounded bg-brand-bg-skeleton-1 animate-pulse mb-6" />
          <div className="h-10 w-64 rounded bg-brand-bg-skeleton-1 animate-pulse mb-2" />
          <div className="h-4 w-96 rounded bg-brand-bg-skeleton-1 animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-square w-full rounded-2xl bg-brand-bg-skeleton-1 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-brand-bg-skeleton-1 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-brand-bg-skeleton-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-tertiary to-brand-dark flex items-center justify-center">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-brand-text-light mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-brand-text-secondary mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg bg-brand-gold text-brand-dark font-medium hover:bg-brand-text-gold-light transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-tertiary to-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'New Arrivals' },
            ]}
          />
          <div className="mt-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-gold/10 mb-6">
              <Sparkles className="w-10 h-10 text-brand-gold" />
            </div>
            <h2 className="text-2xl font-bold text-brand-text-light mb-3">
              No New Arrivals Yet
            </h2>
            <p className="text-brand-text-secondary mb-8 max-w-md mx-auto">
              We're working on bringing you the latest styles. Check back soon for exciting new products!
            </p>
            <a
              href="/"
              className="inline-block px-8 py-3 rounded-lg bg-brand-gold text-brand-dark font-medium hover:bg-brand-text-gold-light transition-colors"
            >
              Browse All Products
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── New Arrivals page ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-dark-tertiary to-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'New Arrivals' },
          ]}
        />

        {/* Header with animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mt-8 mb-12"
        >
          {/* Title with sparkle icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-text-gold-light via-brand-text-light to-brand-gold bg-clip-text text-transparent"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              New Arrivals
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-lg text-brand-text-secondary max-w-2xl mb-4">
            Discover our latest additions — fresh styles curated just for you
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-brand-gold/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-sm font-medium text-brand-text-light">
                {products.length} New Product{products.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 text-brand-text-secondary">
              <TrendingUp size={16} className="text-brand-gold" />
              <span className="text-sm">Just Added</span>
            </div>

            <div className="flex items-center gap-2 text-brand-text-secondary">
              <Clock size={16} className="text-brand-gold" />
              <span className="text-sm">Limited Stock</span>
            </div>
          </div>
        </motion.div>

        {/* Product grid with stagger animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ProductGrid products={products} />
        </motion.div>

        {/* Footer message */}
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 mb-8 text-center"
          >
            <div className="inline-block px-6 py-3 rounded-lg bg-brand-dark-tertiary border border-brand-gold/30">
              <p className="text-sm text-brand-text-secondary">
                ✨ More styles coming soon. Stay tuned for exclusive drops!
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
