// front-end/src/middleware.ts
// NOTE: Since we use localStorage (client-only), we cannot protect routes
// at the middleware level without setting a cookie alongside localStorage.
// Solution A (implemented here): Set a lightweight session cookie on login
//   and clear it on logout, used ONLY for middleware route protection.
// Solution B: Handle redirects client-side in page components.
// We implement Solution A here.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/account'];
const publicAccountRoutes = ['/account/wishlist']; // Guest-accessible routes

export function middleware(request: NextRequest) {
  // Check for our session cookie (set during login — see FIX below)
  const sessionCookie = request.cookies.get('luxe_session')?.value;

  // Allow public account routes for guests (wishlist uses localStorage)
  const isPublicRoute = publicAccountRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*'],
};