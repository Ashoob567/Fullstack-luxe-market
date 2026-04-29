export interface ProductVariant {
  id: number;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  price: number;
  salePrice: number | null;
}

export interface ProductImage {
  id: number;
  image: string;
  alt: string | null;
  isPrimary: boolean;
}

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent: number | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
  tags: ProductTag[];
  isFeatured: boolean;
  isFlashSale: boolean;
  flashSaleEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

export interface ProductFilters {
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  ordering?: string;
}
