import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/api/health',
  '/auth/callback',
];

const isPublicRoute = (path: string) =>
  PUBLIC_ROUTES.some((route) => path === route) ||
  path.startsWith('/_next/') ||
  path.startsWith('/api/public/') ||
  path.startsWith('/auth/') ||
  /\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/.test(path);

/**
 * Enhanced security headers for the application
 */
const getSecurityHeaders = () => ({
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-DNS-Prefetch-Control': 'off',
});

/**
 * Main middleware function that handles all requests
 * Provides authentication, authorization, and security features
 */
export async function middleware(request: NextRequest) {
  try {
    let response: NextResponse;

    // Handle public routes with minimal processing
    if (isPublicRoute(request.nextUrl.pathname)) {
      response = NextResponse.next();
    } else {
      // Process authentication for protected routes
      response = await updateSession(request);
    }

    // Apply security headers to all responses
    const securityHeaders = getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add CSP header for additional security
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co;"
      );
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Return a safe response with security headers even on error
    const errorResponse = NextResponse.next({ request });
    const securityHeaders = getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    
    return errorResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
