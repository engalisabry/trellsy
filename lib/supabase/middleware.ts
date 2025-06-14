import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Simplified middleware for authentication and redirects
 * Focuses on core functionality with reduced complexity
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Get current session without forcing refresh
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    // Define public routes
    const publicRoutes = [
      '/auth',
      '/login', 
      '/sign-up',
      '/_next',
      '/api/public'
    ];
    
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    ) || request.nextUrl.pathname === '/' ||
        /\.(svg|png|jpg|jpeg|gif|webp|css|js|ico)$/.test(request.nextUrl.pathname);

    // Handle auth callback with timestamp (post-login)
    if (request.nextUrl.searchParams.has('t')) {
      return response;
    }

    // Redirect unauthenticated users from protected routes
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users from auth pages
    if (user && (request.nextUrl.pathname.startsWith('/auth') || 
                 request.nextUrl.pathname.startsWith('/login') ||
                 request.nextUrl.pathname.startsWith('/sign-up'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/organization';
      return NextResponse.redirect(url);
    }

    // Handle organization routing for authenticated users
    if (user && (request.nextUrl.pathname === '/' || 
                 request.nextUrl.pathname === '/organization' ||
                 request.nextUrl.pathname === '/protected')) {
      
      // Check user organizations (with error handling)
      try {
        const { data: organizations } = await supabase
          .from('OrganizationMembers')
          .select('organization_id')
          .eq('profile_id', user.id)
          .limit(1); // Only need to check if any exist

        const hasOrganizations = organizations && organizations.length > 0;

        // Redirect to create organization if none exist
        if (!hasOrganizations && request.nextUrl.pathname !== '/create-organization') {
          const url = request.nextUrl.clone();
          url.pathname = '/create-organization';
          return NextResponse.redirect(url);
        }

        // Redirect root to organization page if user has organizations
        if (hasOrganizations && (request.nextUrl.pathname === '/' || 
                                request.nextUrl.pathname === '/protected')) {
          const url = request.nextUrl.clone();
          url.pathname = '/organization';
          return NextResponse.redirect(url);
        }
      } catch (error) {
        console.error('Organization check failed:', error);
        // Continue with request on database error
      }
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // Return basic response on any error to avoid breaking the app
    return NextResponse.next({ request });
  }
}
