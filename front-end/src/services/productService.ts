// ============================================================
// services/productService.ts
// ============================================================

import api from "@/lib/api";
import { PaginatedResponse, ProductList, ProductDetail } from "@/types";

export interface ProductParams {
  page?:          number;
  search?:        string;
  category?:      string;    // slug
  ordering?:      string;    // e.g. "-created_at", "base_price"
  is_featured?:   boolean;
  is_flash_sale?: boolean;
}

export const getProducts = async (
  params?: ProductParams
): Promise<PaginatedResponse<ProductList>> => {
  const { data } = await api.get("/api/products/", { params });
  return data;
};

export const getProductDetail = async (slug: string): Promise<ProductDetail> => {
  const { data } = await api.get(`/api/products/${slug}/`);
  return data;
};

export const getFeaturedProducts = async (): Promise<PaginatedResponse<ProductList>> => {
  return getProducts({ is_featured: true });
};

export const getFlashSaleProducts = async (page?: number): Promise<PaginatedResponse<ProductList>> => {
  const { data } = await api.get("/api/products/flash-sale/", { params: { page } });
  return data;
};

export const getNewArrivals = async (page?: number): Promise<PaginatedResponse<ProductList>> => {
  const { data } = await api.get("/api/products/new-arrivals/", { params: { page } });
  return data;
};