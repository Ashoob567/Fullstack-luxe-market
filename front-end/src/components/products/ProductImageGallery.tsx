'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types/product';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  images: ProductImage[];
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(
    images.find((img) => img.isPrimary) || images[0]
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
        <Image
          src={selectedImage.image}
          alt={selectedImage.alt || 'Product image'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md border transition-all hover:border-primary',
                selectedImage.id === image.id ? 'border-primary ring-2 ring-primary/20' : ''
              )}
            >
              <Image
                src={image.image}
                alt={image.alt || 'Thumbnail'}
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
