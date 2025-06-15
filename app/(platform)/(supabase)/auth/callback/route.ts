import { NextResponse } from 'next/server';
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';
  const state = searchParams.get('state');

  console.log('Auth callback received:', { 
    url: request.url,
    params: Object.fromEntries(searchParams.entries()),
    origin,
    next,
    state
  });

  if (code) {
    console.log('Code received, exchanging for session...');
    
    // Create a Supabase client with proper cookie handling for the callback
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
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    console.log('Exchange result:', { 
      error: error?.message,
      session: data?.session ? 'Session present' : 'No session',
      user: data?.session?.user?.id,
      cookiesList: cookieStore.getAll().map(c => c.name)
    });
    
    if (!error && data.session) {
      // Verify the session was created successfully
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('User verification after exchange:', {
        user: userData?.user?.id,
        error: userError?.message
      });
      
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      // Redirect to organization page for authenticated users
      const redirectPath = '/organization';
      
      // Add a timestamp to bust any caching
      const timestamp = new Date().getTime();
      const redirectUrl = `${redirectPath}?t=${timestamp}`;
      
      console.log('Successful login, redirecting to:', redirectUrl);
      
      // Create a response with the redirect
      const response = isLocalEnv
        ? NextResponse.redirect(`${origin}${redirectUrl}`)
        : forwardedHost
          ? NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
          : NextResponse.redirect(`${origin}${redirectUrl}`);
      
      return response;
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
