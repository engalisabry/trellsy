import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  syncUserProfile,
  userHasOrganizations,
} from '@/lib/services/auth.service';
import { db } from '@/lib/utils/db';

export async function GET(request: Request) {
  const { searchParams, hash, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');
  const type = searchParams.get('type'); // Check if this is email verification

  // Handle error from OAuth provider
  if (error) {
    console.error(`OAuth error: ${error}`, error_description);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error_description || error)}`,
    );
  }

  // Handle both code flow and implicit flow (token in hash fragment)
  if (code || hash.includes('access_token=')) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch (e) {
              console.error('Error setting cookies:', e);
              // This can be ignored if you have middleware refreshing user sessions
            }
          },
        },
      },
    );

    try {
      let session;

      if (code) {
        // Authorization code flow
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        session = data.session;
      } else if (hash) {
        // Implicit flow (token in URL fragment)
        // This is a fallback for when the code flow doesn't work
        // We need to manually set the session from the hash parameters
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const expires_in = parseInt(params.get('expires_in') || '3600');

        if (access_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          });

          if (error) throw error;
          session = data.session;
        }
      }

      if (!session) {
        throw new Error('No session established');
      }

      // Get user data
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      let redirectPath = '/organization';

      // Check if this is email verification - redirect to login
      if (type === 'signup' || type === 'email_confirmation') {
        redirectPath = '/auth/login?message=' + encodeURIComponent('Email verified successfully! You can now log in.');
      } else if (user) {
        try {
          // Sync user profile with database
          await syncUserProfile(user.id, {
            email: user.email,
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
          });

          // Check if user has any organizations
          const hasOrganizations = await userHasOrganizations(user.id);

          // Redirect based on organization membership
          redirectPath = hasOrganizations
            ? '/organization'
            : '/create-organization';
        } catch (error) {
          console.error('Error checking user organizations:', error);
          // Default to create-organization if we can't check
          redirectPath = '/create-organization';
        }
      }

      const isLocalEnv = process.env.NODE_ENV === 'development';
      const forwardedHost = request.headers.get('x-forwarded-host');

      const redirectUri = isLocalEnv
        ? `${origin}${redirectPath}`
        : forwardedHost
          ? `https://${forwardedHost}${redirectPath}`
          : `${origin}${redirectPath}`;

      return NextResponse.redirect(redirectUri);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`,
      );
    }
  }

  // Fallback for when no code or token is present
  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent('Authentication failed. No authorization code or token received.')}`,
  );
}
