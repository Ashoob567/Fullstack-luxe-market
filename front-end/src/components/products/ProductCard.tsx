'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Product } from '@/types/product';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, getDiscountPercentage } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const hasVariants = product.variants.length > 0;

  const lowestPrice = hasVariants
    ? Math.min(...product.variants.map((v) => v.salePrice ?? v.price))
    : product.variants[0]?.salePrice ?? product.variants[0]?.price ?? 0;

  const highestPrice = hasVariants
    ? Math.max(...product.variants.map((v) => v.salePrice ?? v.price))
    : product.variants[0]?.salePrice ?? product.variants[0]?.price ?? 0;

  const discount = product.variants[0]?.salePrice
    ? getDiscountPercentage(product.variants[0].price, product.variants[0].salePrice)
    : 0;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
          {primaryImage && (
            <Image
              src={primaryImage.image}
              alt={primaryImage.alt || product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          )}
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              -{discount}%
            </Badge>
          )}
          {product.isFlashSale && (
            <Badge className="absolute top-2 left-2 bg-orange-500">
              Flash Sale
            </Badge>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 bg-white/80 backdrop-blur hover:bg-white"
            onClick={handleWishlistToggle}
          >
            <Heart
              className={`h-4 w-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`}
            />
          </Button>
        </div>
        <div className="p-4">
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-medium truncate group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">{product.category.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-semibold">
              {lowestPrice === highestPrice
                ? formatPrice(lowestPrice)
                : `${formatPrice(lowestPrice)} - ${formatPrice(highestPrice)}`}
            </span>
            {product.variants[0]?.salePrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.variants[0].price)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
