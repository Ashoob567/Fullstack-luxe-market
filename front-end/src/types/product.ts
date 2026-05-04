// src/types/product.ts

export type UUID = string;

//
// CATEGORY
//
export interface Category {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent_id: UUID | null;
  children?: Category[];
}

//
// PRODUCT TAG
//
export interface ProductTag {
  id: UUID;
  name: string;
  slug: string;
}

//
// PRODUCT IMAGE
//
export interface ProductImage {
  id: UUID;
  image: string | null;
  url: string | null;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

//
// PRODUCT VARIANT
//
export interface ProductVariant {
  id: UUID;
  sku: string;
  size: string | null;
  color: string | null;
  stock_qty: number;
  final_price: string;
  is_in_stock: boolean;
}

//
// PRODUCT LIST ITEM
// homepage / featured / shop cards
//
export interface ProductCard {
  id: UUID;
  name: string;
  slug: string;

  base_price: string;
  sale_price: string | null;

  discount_percentage: string;
  is_on_sale: boolean;
  is_featured: boolean;

  primary_image: string | null;

  category_id: UUID | null;
  category_name: string | null;

  average_rating: number | null;
  is_in_stock: boolean;

  // Flash Sale
  is_flash_sale: boolean;
  is_flash_active: boolean;
  flash_sale_price: string | null;
  flash_sale_ends_at: string | null;
}

//
// FULL PRODUCT DETAIL
//
export interface Product {
  id: UUID;
  name: string;
  slug: string;
  description: string;

  category: Category | null;

  base_price: string;
  sale_price: string | null;

  is_featured: boolean;
  is_active: boolean;

  tags: ProductTag[];

  images: ProductImage[];
  variants: ProductVariant[];
  primary_image: string | null;


  average_rating: number | null;
  review_count: number;

  created_at: string;
  updated_at: string;

  // Flash Sale
  is_flash_sale: boolean;
  is_flash_active: boolean;
  flash_sale_price: string | null;
  flash_sale_ends_at: string | null;

  is_in_stock:boolean;
}

//
// PAGINATION
//
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

//
// FILTERS
//
export interface ProductFilters {
  page?: number;
  search?: string;
  category?: UUID;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  inStock?: boolean;

  ordering?:
    | "name"
    | "-name"
    | "base_price"
    | "-base_price"
    | "created_at"
    | "-created_at";
}

//
// UI HELPERS
//
export interface SelectOption {
  label: string;
  value: string;
}