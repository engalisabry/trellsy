import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware to handle authentication and redirects
 * This version properly handles errors without throwing them
 */
export async function updateSession(request: NextRequest) {
  // Create a response that we'll modify later
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    // Initialize Supabase client
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
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Get the user - critical for authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user in middleware:', userError.message);
    }

    // Define public routes that don't require authentication
    const isPublicRoute =
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/auth') ||
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|css|js)$/) ||
      request.nextUrl.pathname.startsWith('/_next');

    // If no user and trying to access protected route, redirect to login
    if (!user && !isPublicRoute) {
      console.log(`Redirecting unauthenticated user from ${request.nextUrl.pathname} to /auth/login`);
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    // If user is authenticated and trying to access certain routes, handle organization checks
    if (
      user &&
      (request.nextUrl.pathname === '/protected' ||
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname === '/organization')
    ) {
      try {
        // Check if user has organizations
        const { data: organizations, error: orgError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id);

        if (orgError) {
          console.error('Error checking organizations in middleware:', orgError.message);
          // Continue with the request despite the error
          return supabaseResponse;
        }

        // If no organizations, redirect to create organization page
        if (!organizations?.length) {
          console.log(`Redirecting user ${user.id} to /create-organization (no organizations found)`);
          const url = request.nextUrl.clone();
          url.pathname = '/create-organization';
          return NextResponse.redirect(url);
        }

        // If accessing root or /protected, redirect to organization page
        if (
          request.nextUrl.pathname === '/' ||
          request.nextUrl.pathname === '/protected'
        ) {
          console.log(`Redirecting user ${user.id} from ${request.nextUrl.pathname} to /organization`);
          const url = request.nextUrl.clone();
          url.pathname = '/organization';
          return NextResponse.redirect(url);
        }
      } catch (error) {
        // Log the error but don't throw it
        console.error('Error in middleware organization check:', error);
        // Continue with the request despite the error
        return supabaseResponse;
      }
    }

    return supabaseResponse;
  } catch (error) {
    // Catch any unexpected errors
    console.error('Unexpected error in middleware:', error);
    // Return the original response to avoid breaking the app
    return supabaseResponse;
  }
}
