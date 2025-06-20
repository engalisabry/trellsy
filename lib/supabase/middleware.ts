import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware for authentication and redirects
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

    // Get authenticated user (more secure than getSession)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Auth error in middleware:', userError);
    }

    // Define public routes
    const publicRoutes = [
      '/auth',
      '/login',
      '/sign-up',
      '/_next',
      '/api/public',
      '/create-organization',
    ];

    const isPublicRoute =
      publicRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route),
      ) ||
      request.nextUrl.pathname === '/' ||
      /\.(svg|png|jpg|jpeg|gif|webp|css|js|ico)$/.test(
        request.nextUrl.pathname,
      );

    // Handle auth callback
    if (request.nextUrl.pathname.includes('/auth/callback')) {
      return response;
    }

    // Redirect unauthenticated users from protected routes
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users from auth pages
    if (
      user &&
      (request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/sign-up'))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/organization';
      return NextResponse.redirect(url);
    }

// Handle organization routing for authenticated users
    if (
      user &&
      (request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname === '/organization' ||
        request.nextUrl.pathname === '/protected' ||
        request.nextUrl.pathname === '/create-organization')
    ) {
      // Check user organizations (with error handling)
      try {
        // Use Supabase for middleware since Prisma can't run in edge runtime
        // Note: We need to keep using Supabase data API here since Edge runtime doesn't support Prisma
        const [membershipCheck, createdOrgCheck] = await Promise.all([
          supabase
            .from('OrganizationMembers')
            .select('organization_id')
            .eq('profile_id', user.id)
            .limit(1),
          supabase
            .from('Organization')
            .select('id')
            .eq('created_by', user.id)
            .limit(1)
        ]);

        const hasOrganizations = 
          (membershipCheck.data && membershipCheck.data.length > 0) ||
          (createdOrgCheck.data && createdOrgCheck.data.length > 0);

        // Redirect to create organization if none exist
        if (
          !hasOrganizations &&
          request.nextUrl.pathname !== '/create-organization'
        ) {
          const url = request.nextUrl.clone();
          url.pathname = '/create-organization';
          return NextResponse.redirect(url);
        }

        // Redirect root to organization page if user has organizations
        if (
          hasOrganizations &&
          (request.nextUrl.pathname === '/' ||
            request.nextUrl.pathname === '/protected')
        ) {
          const url = request.nextUrl.clone();
          url.pathname = '/organization';
          return NextResponse.redirect(url);
        }
      } catch (error) {
        console.error('Organization check failed:', error);
        // Continue with the request even if organization check fails
        return response;
      }
    }

    return response;
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.next({ request });
  }
}
