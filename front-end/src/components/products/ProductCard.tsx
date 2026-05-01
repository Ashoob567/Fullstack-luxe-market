// src/components/products/ProductCard.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Heart, ShoppingCart, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Product, ProductVariant } from "@/types/product";
import type { CartItem } from "@/types/order";

import { useCartStore } from "@/store/cartStore";

// ─────────────────────────────────────────────────────────────
// Brand Colors
// ─────────────────────────────────────────────────────────────
const BRAND = {
  navy: "#1B3A5C",
  gold: "#8B6914",
  espresso: "#2C2416",
  sand: "#F5F3EF",
  red: "#C0392B",
} as const;

// ─────────────────────────────────────────────────────────────
// Star Rating
// ─────────────────────────────────────────────────────────────
function StarRow() {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          fill={BRAND.gold}
          stroke={BRAND.gold}
          strokeWidth={1.4}
        />
      ))}

      <span className="text-[10px] text-[#7A7060] ml-1">(New)</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Variant Modal
// ─────────────────────────────────────────────────────────────
interface VariantModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: (variant: ProductVariant) => void;
}

function VariantModal({
  product,
  onClose,
  onConfirm,
}: VariantModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedId) || null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl p-6 mx-4"
        style={{ backgroundColor: BRAND.sand }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-base font-semibold mb-1"
          style={{ color: BRAND.espresso }}
        >
          Select Variant
        </h3>

        <p className="text-xs text-muted-foreground mb-4">
          {product.name}
        </p>

        <div className="space-y-2">
          {product.variants.map((variant) => {
            const active = variant.id === selectedId;

            const finalPrice =
              variant.salePrice ?? variant.price;

            return (
              <button
                key={variant.id}
                onClick={() => setSelectedId(variant.id)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-left transition",
                  active && "border-[#1B3A5C] bg-white"
                )}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {variant.size || "Standard"}
                      {variant.color &&
                        ` • ${variant.color}`}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      SKU: {variant.sku}
                    </p>
                  </div>

                  <p className="font-semibold text-sm">
                    ${finalPrice.toFixed(2)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-5">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            className="flex-1 text-white"
            style={{ backgroundColor: BRAND.navy }}
            disabled={!selectedVariant}
            onClick={() => {
              if (selectedVariant) {
                onConfirm(selectedVariant);
                onClose();
              }
            }}
          >
            Add To Cart
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: Product;
}

export function ProductCard({
  product,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const [wishlisted, setWishlisted] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  // Primary Image
  const imageUrl =
    product.images.find((img) => img.isPrimary)
      ?.image ||
    product.images[0]?.image ||
    "/placeholder.png";

  // Cheapest Variant
  const cheapestVariant = useMemo(() => {
    return [...product.variants].sort((a, b) => {
      const aPrice = a.salePrice ?? a.price;
      const bPrice = b.salePrice ?? b.price;
      return aPrice - bPrice;
    })[0];
  }, [product.variants]);

  const inStock = product.variants.some(
    (v) => v.stock > 0
  );

  const hasVariants =
    product.variants.length > 1;

  const displayPrice =
    cheapestVariant?.salePrice ??
    cheapestVariant?.price ??
    0;

  const originalPrice =
    cheapestVariant?.salePrice !== null
      ? cheapestVariant.price
      : null;

  // Create Cart Item
  const createCartItem = useCallback(
    (variant: ProductVariant): CartItem => ({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      slug: product.slug,
      image: imageUrl,
      price: variant.price,
      salePrice: variant.salePrice,
      size: variant.size,
      color: variant.color,
      quantity: 1,
    }),
    [product, imageUrl]
  );

  // Wishlist
  const handleWishlist = () => {
    setWishlisted((prev) => !prev);
  };

  // Add To Cart
  const handleAddToCart = () => {
    if (hasVariants) {
      setShowModal(true);
      return;
    }

    addItem(createCartItem(cheapestVariant));
  };

  // Buy Now
  const handleBuyNow = () => {
    handleAddToCart();

    // router.push("/checkout")
  };

  return (
    <>
      <Card className="group overflow-hidden rounded-xl border border-[#E8E4DC] hover:shadow-md transition">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-[#F0EDE8] overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />

          {/* Flash Sale */}
          {product.isFlashSale && (
            <Badge
              className="absolute top-3 left-3 text-white"
              style={{
                backgroundColor: BRAND.red,
              }}
            >
              Flash Sale
            </Badge>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white shadow flex items-center justify-center"
          >
            <Heart
              size={14}
              fill={
                wishlisted
                  ? BRAND.red
                  : "none"
              }
              stroke={
                wishlisted
                  ? BRAND.red
                  : "#9C9488"
              }
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-2">
          {/* Category */}
          <p className="text-[11px] uppercase tracking-widest text-[#9C9488]">
            {product.category.name}
          </p>

          {/* Name */}
          <h3
            className="text-sm font-medium line-clamp-1"
            style={{
              color: BRAND.espresso,
            }}
          >
            {product.name}
          </h3>

          <StarRow />

          {/* Price */}
          <div className="flex items-center gap-2">
            <span
              className="font-bold"
              style={{
                color: BRAND.gold,
              }}
            >
              ${displayPrice.toFixed(2)}
            </span>

            {originalPrice && (
              <span className="text-xs line-through text-muted-foreground">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 text-white"
              style={{
                backgroundColor:
                  BRAND.navy,
              }}
              disabled={!inStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart size={14} />
              Add
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={!inStock}
              onClick={handleBuyNow}
            >
              <Zap size={14} />
              Buy
            </Button>
          </div>

          {!inStock && (
            <p className="text-[10px] uppercase text-center text-muted-foreground">
              Out of Stock
            </p>
          )}
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <VariantModal
          product={product}
          onClose={() =>
            setShowModal(false)
          }
          onConfirm={(variant) =>
            addItem(
              createCartItem(variant)
            )
          }
        />
      )}
    </>
  );
}

export default ProductCard;