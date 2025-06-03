import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/api/health',
];

const isPublicRoute = (path: string) =>
  PUBLIC_ROUTES.some((route) => path === route) ||
  path.startsWith('/_next/') ||
  path.startsWith('/api/public/') ||
  /\.(ico|png|jpg|jpeg|svg)$/.test(path);

/**
 * Main middleware function that handles all requests
 * This wraps the updateSession function with additional security features
 */
export async function middleware(request: NextRequest) {
  try {
    // Skip middleware for public assets and routes
    if (isPublicRoute(request.nextUrl.pathname)) {
      return NextResponse.next();
    }

    // Basic security headers
    const headers = new Headers({
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-XSS-Protection': '1; mode=block',
    });

    // Update session and handle authentication
    const response = await updateSession(request);

    // Add security headers to the response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    // Return a next response to avoid breaking the app
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

export const config = {
  matcher: ['/:path*'],
};
