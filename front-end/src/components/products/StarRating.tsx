import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number | null;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export function StarRating({ rating = 0, size = 16, showLabel = true, className = '' }: StarRatingProps) {
  const filled = Math.round(rating ?? 0);
  const displayRating = rating ?? 0;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < filled ? '#D4890A' : 'none'}
          stroke="#D4890A"
          strokeWidth={1.4}
        />
      ))}
      {showLabel && (
        <span className="text-xs text-muted-foreground ml-1">
          {displayRating > 0 ? `(${displayRating.toFixed(1)})` : '(New)'}
        </span>
      )}
    </div>
  );
}
