/**
 * Safely encodes image URLs for use with next/image
 * Handles spaces and special characters in Supabase storage URLs
 */
export function sanitizeImageUrl(url: string | null | undefined): string {
  // Handle null, undefined, empty string, or URLs ending with just '/'
  if (!url || url.trim() === '' || url.endsWith('/products/colors/') || url.endsWith('/products/') || url.endsWith('/images/')) {
    return '/placeholder-product.svg'; // Fallback image
  }

  try {
    // If it's a full URL, parse and rebuild with proper encoding
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);

      // Check if pathname ends with directory (no filename)
      if (urlObj.pathname.endsWith('/')) {
        console.warn('Image URL is incomplete (no filename):', url);
        return '/placeholder-product.svg';
      }

      // Split pathname and encode each segment separately
      const pathSegments = urlObj.pathname.split('/');
      const encodedSegments = pathSegments.map(segment =>
        // Don't double-encode already encoded segments
        segment.includes('%') ? segment : encodeURIComponent(segment)
      );

      urlObj.pathname = encodedSegments.join('/');
      return urlObj.toString();
    }

    // For relative paths, encode the whole path
    return encodeURI(url);
  } catch (error) {
    console.error('Failed to sanitize image URL:', url, error);
    return '/placeholder-product.svg';
  }
}

/**
 * Generates a placeholder image URL for missing/broken images
 */
export function getPlaceholderImage(width = 400, height = 400): string {
  // Using a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#F5F0E8"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#A09080" text-anchor="middle" dy=".3em">
        No Image Available
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Validates if an image URL is accessible
 * Note: This should be used sparingly as it makes network requests
 */
export async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
