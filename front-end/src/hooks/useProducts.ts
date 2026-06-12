// ============================================================
// hooks/useProducts.ts
// ============================================================

import { useState, useEffect } from "react";
import { getProducts, getProductDetail, ProductParams } from "@/services/productService";
import { parseApiError } from "@/lib/utils";
import { ProductList, ProductDetail, PaginatedResponse } from "@/types";

// ----------------------------------------------------------
// useProductList — listing page
// ----------------------------------------------------------

export const useProductList = (params?: ProductParams) => {
  const [data, setData]           = useState<PaginatedResponse<ProductList> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getProducts(params);
        setData(result);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { data, isLoading, error };
};

// ----------------------------------------------------------
// useProductDetail — detail page
// ----------------------------------------------------------

export const useProductDetail = (slug: string) => {
  const [product, setProduct]     = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getProductDetail(slug);
        setProduct(result);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [slug]);

  return { product, isLoading, error };
};