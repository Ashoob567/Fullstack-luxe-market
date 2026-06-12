'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { sanitizeImageUrl } from '@/lib/image-utils';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string | null | undefined;
  fallback?: string;
}

/**
 * Image component with automatic fallback for broken/invalid URLs
 * Sanitizes URLs to handle spaces and special characters
 */
export function ImageWithFallback({
  src,
  fallback = '/placeholder-product.svg',
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(sanitizeImageUrl(src));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallback);
    }
  };

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
    />
  );
}
