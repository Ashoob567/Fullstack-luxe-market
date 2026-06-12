import { Badge } from '@/components/ui/badge';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';

interface ProductCardImageProps {
  imageUrl: string;
  productName: string;
  isFlashActive: boolean;
  isOnSale: boolean;
  priority?: boolean; // For LCP optimization - eager load above-the-fold images
}

const BRAND = {
  red: '#C0392B',
  gold: '#8B6914',
} as const;

export function ProductCardImage({ imageUrl, productName, isFlashActive, isOnSale, priority = false }: ProductCardImageProps) {
  return (
    <div className="relative aspect-[3/4] bg-[#F0EDE8] overflow-hidden">
      <ImageWithFallback
        src={imageUrl}
        alt={productName}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition duration-300 group-hover:scale-105"
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
      />

      {isFlashActive && (
        <Badge className="absolute top-3 left-3 text-white" style={{ backgroundColor: BRAND.red }}>
          Flash Sale
        </Badge>
      )}

      {!isFlashActive && isOnSale && (
        <Badge className="absolute top-3 left-3 text-white" style={{ backgroundColor: BRAND.gold }}>
          Sale
        </Badge>
      )}
    </div>
  );
}
