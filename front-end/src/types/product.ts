// ============================================================
// types/product.ts
// Based on: products/serializers.py
// ============================================================

import { Review } from "./review";

// ----------------------------------------------------------
// Category
// ----------------------------------------------------------

export interface Category {
  id: string;                        // UUID
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent_id: string | null;          // UUID — null if root category
  children: Category[];              // recursive — nested subcategories
  is_active: boolean;
  created_at: string;                // ISO datetime string
}

// ----------------------------------------------------------
// Product Tag
// ----------------------------------------------------------

export interface ProductTag {
  id: string;                        // UUID
  name: string;
  slug: string;
}

// ----------------------------------------------------------
// Product Image
// ----------------------------------------------------------

export interface ProductImage {
  id: string;                        // UUID
  image: string | null;              // relative path
  url: string | null;                // absolute URL (SerializerMethodField)
  alt_text: string | null;
  color: string | null;              // Color variant this image represents
  is_primary: boolean;
  order: number;
}

// ----------------------------------------------------------
// Product Variant
// ----------------------------------------------------------

export interface ProductVariant {
  id: string;                        // UUID
  sku: string;
  size: string | null;
  color: string | null;
  stock_qty: number;
  price_modifier: string;            // DRF Decimal → string
  final_price: string;               // DRF Decimal → string (computed)
  is_in_stock: boolean;              // computed property
}

// ----------------------------------------------------------
// Color Variant Group (for product card color selector)
// OLD STRUCTURE - will be deprecated
// ----------------------------------------------------------

export interface ColorVariantSize {
  size: string;
  variant_id: string;
  sku: string;
  stock_qty: number;
  price_modifier: string;
  final_price: string;
}

export interface ColorVariant {
  color: string;
  image_url: string | null;
  sizes: ColorVariantSize[];
  in_stock: boolean;
}

// ----------------------------------------------------------
// UNIFIED VARIANT STRUCTURE (NEW - Recommended!) ✨
// Product → VariantV2 (color + size + image in one!)
// ----------------------------------------------------------

export interface ProductVariantV2 {
  id: string;
  color_name: string;
  hex_primary: string;
  hex_light: string | null;
  hex_dark: string | null;
  image_url: string | null;
  size_name: string;
  sku: string;
  stock_quantity: number;
  price_adjustment: string;
  is_in_stock: boolean;
  final_price: string;
  display_order: number;
}

export interface ProductColor {
  color_name: string;
  hex_primary: string;
  hex_light: string | null;
  hex_dark: string | null;
  image_url: string | null;
  in_stock: boolean;
}

// ----------------------------------------------------------
// OLD NESTED STRUCTURE (DEPRECATED)
// Product → Color → Size hierarchy
// ----------------------------------------------------------

export interface ProductSizeVariant {
  id: string;
  size_name: string;
  sku: string;
  stock_quantity: number;
  price_adjustment: string;
  is_in_stock: boolean;
  final_price: string;
  display_order: number;
}

export interface ProductColorVariant {
  id: string;
  color_name: string;
  hex_primary: string;
  hex_light: string | null;
  hex_dark: string | null;
  image_url: string | null;
  size_variants: ProductSizeVariant[];
  is_in_stock: boolean;
  total_stock: number;
  display_order: number;
}

// ----------------------------------------------------------
// Product List (Card view — lightweight)
// ----------------------------------------------------------

export interface ProductList {
  id: string;                        // UUID
  name: string;
  slug: string;
  description: string | null;        // Product description/subtitle
  base_price: string;                // DRF Decimal → string
  sale_price: string | null;         // DRF Decimal → string
  effective_price: string;           // computed: flash > sale > base
  discount_percentage: string | null;// DRF Decimal → string
  is_on_sale: boolean;
  // Flash Sale
  is_flash_sale: boolean;
  flash_sale_price: string | null;   // DRF Decimal → string
  flash_sale_ends_at: string | null; // ISO datetime string
  is_flash_active: boolean;
  is_featured: boolean;
  is_active: boolean;
  primary_image: string | null;      // absolute URL

  // NEW UNIFIED STRUCTURE (Recommended!)
  variants?: ProductVariantV2[];     // All variants (flat structure)
  colors?: ProductColor[];           // Unique colors (for color selector)

  // OLD STRUCTURES (Deprecated)
  images?: ProductImage[];           // All product images
  color_variants?: ColorVariant[];   // OLD flat structure
  color_variants_new?: ProductColorVariant[];  // Normalized structure (Current!)

  tags?: ProductTag[];               // Product tags for badges (NEW ARRIVAL, SALE, etc.)

  category_id: string | null;        // UUID
  category_name: string | null;
  average_rating: number | null;     // computed
  review_count: number;              // computed
  is_in_stock: boolean;              // computed
}

// ----------------------------------------------------------
// Product Detail (Full page view)
// ----------------------------------------------------------

export interface ProductDetail {
  id: string;                        // UUID
  name: string;
  slug: string;
  description: string | null;
  category: Category | null;         // full nested object
  base_price: string;                // DRF Decimal → string
  sale_price: string | null;
  effective_price: string;           // computed
  discount_percentage: number | null;// FloatField in detail serializer
  is_on_sale: boolean;
  // Flash Sale
  is_flash_sale: boolean;
  flash_sale_price: string | null;
  flash_sale_ends_at: string | null;
  is_flash_active: boolean;
  is_featured: boolean;
  is_active: boolean;
  tags: ProductTag[];
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
  primary_image: string | null;
  average_rating: number | null;
  review_count: number;
  is_in_stock: boolean;
  reviews: Review[];
}