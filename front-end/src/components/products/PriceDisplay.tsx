import { formatPrice } from '@/lib/utils';

interface PriceDisplayProps {
  price: string | number;
  originalPrice?: string | number | null;
  discountPercentage?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceDisplay({
  price,
  originalPrice,
  discountPercentage,
  size = 'md',
  className = '',
}: PriceDisplayProps) {
  const currentPrice = typeof price === 'string' ? parseFloat(price) : price;
  const oldPrice =
    originalPrice && typeof originalPrice === 'string'
      ? parseFloat(originalPrice)
      : typeof originalPrice === 'number'
      ? originalPrice
      : null;

  const hasDiscount = oldPrice !== null && oldPrice > currentPrice;
  const discount = discountPercentage ?? 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`font-bold text-[#8B6914] ${sizeClasses[size]}`}>
        {formatPrice(currentPrice)}
      </span>

      {hasDiscount && (
        <>
          <span className={`text-muted-foreground line-through ${size === 'lg' ? 'text-base' : 'text-xs'}`}>
            {formatPrice(oldPrice!)}
          </span>
          {discount > 0 && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
              -{Math.round(discount)}%
            </span>
          )}
        </>
      )}
    </div>
  );
}
