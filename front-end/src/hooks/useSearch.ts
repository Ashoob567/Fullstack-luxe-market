import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { get } from '@/lib/api';

interface UseSearchOptions {
  query?: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  ordering?: string;
}

export function useSearch(options: UseSearchOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const search = async (searchOptions: UseSearchOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (searchOptions.query) params.set('search', searchOptions.query);
      if (searchOptions.category) params.set('category', String(searchOptions.category));
      if (searchOptions.minPrice) params.set('min_price', String(searchOptions.minPrice));
      if (searchOptions.maxPrice) params.set('max_price', String(searchOptions.maxPrice));
      if (searchOptions.size) params.set('size', searchOptions.size);
      if (searchOptions.color) params.set('color', searchOptions.color);
      if (searchOptions.ordering) params.set('ordering', searchOptions.ordering);

      const response = await get<{ results: Product[]; count: number }>('/api/products/', {
        params,
      });

      setProducts(response.results);
      setCount(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(options).length > 0) {
      search(options);
    }
  }, []);

  return {
    products,
    loading,
    error,
    count,
    search,
  };
}
