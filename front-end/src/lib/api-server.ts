// Server-side API utilities (for Server Components & Server Actions)
// Uses fetch with Next.js caching instead of axios

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface FetchOptions extends RequestInit {
  revalidate?: number | false;
  tags?: string[];
}

export async function serverGet<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { revalidate = 3600, tags, ...fetchOptions } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    next: {
      revalidate,
      tags,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export { API_URL };
