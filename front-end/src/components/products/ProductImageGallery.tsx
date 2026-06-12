// front-end/src/components/products/ProductImageGallery.tsx
'use client';

import { useState } from 'react';
import { ProductImage } from '@/types/product';
import { cn } from '@/lib/utils';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';

interface ProductImageGalleryProps {
  images: ProductImage[];
}

function getImageSrc(img: ProductImage): string {
  return img.url || img.image || '/placeholder.png';
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(
    images.find((img) => img.is_primary) || images[0]
  );

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <ImageWithFallback
          src={getImageSrc(selectedImage)}
          alt={selectedImage.alt_text || 'Product image'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>s
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md border transition-all hover:border-primary',
                selectedImage.id === image.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : ''
              )}
            >
              <ImageWithFallback
                src={getImageSrc(image)}
                alt={image.alt_text || 'Thumbnail'}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}