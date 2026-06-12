// src/app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand revalidation API endpoint
 *
 * Usage: POST /api/revalidate?tag=featured&secret=YOUR_SECRET
 *
 * This allows the backend to trigger cache invalidation when products change.
 * Call this from Django signals or admin actions to immediately clear Next.js cache.
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tag = searchParams.get('tag');
  const path = searchParams.get('path');
  const secret = searchParams.get('secret');

  // Verify secret token (optional security measure)
  const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'dev-secret';
  if (secret !== REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    if (tag) {
      // Revalidate by cache tag (e.g., 'featured', 'products')
      revalidateTag(tag);
      return NextResponse.json({
        revalidated: true,
        tag,
        now: Date.now()
      });
    }

    if (path) {
      // Revalidate specific path (e.g., '/', '/products')
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        path,
        now: Date.now()
      });
    }

    return NextResponse.json({
      error: 'Missing tag or path parameter'
    }, { status: 400 });

  } catch (err) {
    console.error('Revalidation error:', err);
    return NextResponse.json({
      error: 'Revalidation failed',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
