'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { ProductVariantSelector } from '@/components/products/ProductVariantSelector';
import { QuantitySelector } from '@/components/products/QuantitySelector';
import { TrustBadges } from '@/components/products/TrustBadges';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { formatPrice } from '@/lib/utils';
import type { ProductDetail, ProductVariant } from '@/types/product';
import { useWishlistStore } from '@/hooks/useWishlistStore';

interface ProductDetailClientProps {
  product: ProductDetail;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <svg
            key={i}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={filled ? '#D4890A' : '#E8E0D5'}
            stroke={filled ? '#D4890A' : '#E8E0D5'}
            strokeWidth="1"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #E8E0D5',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 400,
  fontSize: '0.875rem',
  color: '#5C4A32',
};

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const { isInWishlist, toggleWishlist, isLoading: wishlistLoading } = useWishlistStore();

  const wishlistActive = isInWishlist(product.id);

  // Price calculations
  const p = (v: string | null | undefined): number | null =>
    v != null && v !== '' ? parseFloat(v) : null;

  const variantPriceModifier = p(selectedVariant?.price_modifier);
  const variantFinalPrice = p(selectedVariant?.final_price);
  const variantBasePrice =
    variantFinalPrice !== null && variantPriceModifier !== null
      ? variantFinalPrice - variantPriceModifier
      : variantFinalPrice;

  const productBasePrice = parseFloat(product.base_price);
  const productSalePrice = p(product.sale_price);
  const flashPrice = product.is_flash_active ? p(product.flash_sale_price) : null;

  const effectivePrice: number =
    flashPrice ?? variantFinalPrice ?? variantBasePrice ?? productSalePrice ?? productBasePrice;

  const wasPrice: number | null =
    flashPrice != null
      ? variantBasePrice ?? productBasePrice
      : productSalePrice != null
      ? productBasePrice
      : null;

  const isOnSale = wasPrice !== null && wasPrice > effectivePrice;
  const discountPct = isOnSale && wasPrice ? Math.round(((wasPrice - effectivePrice) / wasPrice) * 100) : 0;

  // Stock
  const inStock = selectedVariant
    ? selectedVariant.is_in_stock && selectedVariant.stock_qty > 0
    : product.is_in_stock;

  const maxQty = selectedVariant?.stock_qty ?? 99;

  // Highlights
  const highlights = product.description
    ? product.description
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean)
        .slice(0, 3)
    : [];

  // Cart image
  const cartImage =
    product.images.find((img) => img.is_primary)?.url ??
    product.images[0]?.url ??
    product.primary_image ??
    '';

  // Prepare cart item data
  const cartItemData = selectedVariant
    ? {
        variant_id: selectedVariant.id,
        product_id: product.id,
        name: product.name,
        image: cartImage,
        price: String(effectivePrice),
        quantity,
        size: selectedVariant.size ?? '',
        color: selectedVariant.color ?? '',
      }
    : null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Left – Gallery */}
        <div>
          <ProductImageGallery images={product.images} />
        </div>

        {/* Right – Details */}
        <div className="flex flex-col gap-5">
          {product.is_flash_active && (
            <span
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                background: '#C4621A',
                color: '#FFFFFF',
                borderRadius: '6px',
                padding: '3px 10px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
              }}
            >
              ⚡ FLASH SALE
            </span>
          )}

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              color: '#3D2F1F',
              marginTop: '0.75rem',
              lineHeight: 1.25,
            }}
          >
            {product.name}
          </h1>

          <div className="flex items-center gap-2">
            <StarRating rating={product.average_rating ?? 0} />
            <a
              href="#reviews"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                fontSize: '0.875rem',
                color: '#A09080',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#3D2F1F')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#A09080')}
            >
              ({product.review_count} reviews)
            </a>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isOnSale ? (
              <>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '2rem',
                    color: '#C4621A',
                  }}
                >
                  {formatPrice(effectivePrice)}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: '1.25rem',
                    color: '#A09080',
                    textDecoration: 'line-through',
                    marginLeft: '8px',
                  }}
                >
                  {formatPrice(wasPrice!)}
                </span>
                {discountPct > 0 && (
                  <span
                    style={{
                      background: '#FEF2E8',
                      color: '#C4621A',
                      border: '1px solid #F5C4A0',
                      borderRadius: '6px',
                      padding: '3px 10px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {discountPct}% OFF
                  </span>
                )}
              </>
            ) : (
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '2rem',
                  color: '#3D2F1F',
                }}
              >
                {formatPrice(effectivePrice)}
              </span>
            )}
          </div>

          {product.variants && product.variants.length > 0 && (
            <ProductVariantSelector
              product={product}
              onVariantSelect={setSelectedVariant}
            />
          )}

          <QuantitySelector
            quantity={quantity}
            maxQty={maxQty}
            onIncrease={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
          />

          {cartItemData && (
            <AddToCartButton
              item={cartItemData}
              disabled={!inStock}
              size="lg"
              fullWidth
              label={!inStock ? 'Out of Stock' : 'Add to Cart'}
            />
          )}

          <button
            onClick={() => toggleWishlist(product.id, {
              name: product.name,
              price: String(effectivePrice),
              image: cartImage,
              slug: product.slug,
              category: product.category?.name || '',
            })}
            disabled={wishlistLoading}
            style={{
              width: '100%',
              background: 'transparent',
              border: `1.5px solid ${wishlistActive ? '#3D2F1F' : '#E8E0D5'}`,
              color: wishlistActive ? '#3D2F1F' : '#5C4A32',
              borderRadius: '10px',
              padding: '14px 24px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: wishlistLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: wishlistLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!wishlistLoading) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = '#3D2F1F';
                el.style.color = '#3D2F1F';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = wishlistActive ? '#3D2F1F' : '#E8E0D5';
              el.style.color = wishlistActive ? '#3D2F1F' : '#5C4A32';
            }}
          >
            <Heart
              size={18}
              fill={wishlistActive ? '#3D2F1F' : 'none'}
              color={wishlistActive ? '#3D2F1F' : 'currentColor'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {wishlistActive ? 'Saved to Wishlist' : 'Add to Wishlist'}
          </button>

          {highlights.length > 0 && (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {highlights.map((point, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      background: '#3D2F1F',
                      borderRadius: '9999px',
                      marginTop: '7px',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 400,
                      fontSize: '0.9rem',
                      color: '#5C4A32',
                      lineHeight: 1.6,
                    }}
                  >
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <TrustBadges />
        </div>
      </div>

      {/* TABS */}
      <div className="mt-16">
        <Tabs defaultValue="description">
          <TabsList
            style={{
              background: '#F5F0E8',
              borderRadius: '10px',
              padding: '4px',
              height: 'auto',
            }}
          >
            {[
              { value: 'description', label: 'Description' },
              { value: 'specifications', label: 'Specifications' },
              { value: 'reviews', label: 'Reviews' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.875rem',
                  borderRadius: '8px',
                  padding: '8px 20px',
                }}
                className="
                  text-[#A09080] font-medium
                  data-[state=active]:bg-white
                  data-[state=active]:text-[#3D2F1F]
                  data-[state=active]:font-semibold
                  data-[state=active]:shadow-[0_2px_8px_rgba(61,47,31,0.1)]
                "
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="description" style={{ paddingTop: '1.5rem' }}>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                fontSize: '1rem',
                lineHeight: 1.8,
                color: '#5C4A32',
              }}
            >
              {product.description}
            </p>
          </TabsContent>

          <TabsContent value="specifications" style={{ paddingTop: '1.5rem' }}>
            {product.variants && product.variants.length > 0 ? (
              <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F5F0E8' }}>
                      {['SKU', 'Size', 'Color', 'Stock', 'Price'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: '#3D2F1F',
                            borderBottom: '1px solid #E8E0D5',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v, i) => {
                      const vFinal = parseFloat(v.final_price);
                      const vModifier = parseFloat(v.price_modifier);
                      const vBase = vFinal - vModifier;
                      const onSale = vModifier !== 0;
                      return (
                        <tr key={v.id} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAF8F4' }}>
                          <td style={tdStyle}>{v.sku}</td>
                          <td style={tdStyle}>{v.size ?? '—'}</td>
                          <td style={tdStyle}>{v.color ?? '—'}</td>
                          <td style={tdStyle}>
                            {v.is_in_stock ? (
                              <span style={{ color: '#2E7D32' }}>{v.stock_qty}</span>
                            ) : (
                              <span style={{ color: '#C4621A' }}>Out of stock</span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            {onSale ? (
                              <>
                                <span style={{ color: '#C4621A', fontWeight: 600 }}>
                                  {formatPrice(vFinal)}
                                </span>{' '}
                                <span
                                  style={{
                                    textDecoration: 'line-through',
                                    color: '#A09080',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {formatPrice(vBase)}
                                </span>
                              </>
                            ) : (
                              formatPrice(vFinal)
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#A09080', fontSize: '0.9rem' }}>
                No variant specifications available.
              </p>
            )}
          </TabsContent>

          <TabsContent id="reviews" value="reviews" style={{ paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: '1rem', color: '#A09080' }}>
                Reviews coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
