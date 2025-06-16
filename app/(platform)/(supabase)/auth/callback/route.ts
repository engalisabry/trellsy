import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
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
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      await supabase.auth.getUser();

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      const redirectPath = '/organization';

      const timestamp = new Date().getTime();
      const redirectUrl = `${redirectPath}?t=${timestamp}`;

      const response = isLocalEnv
        ? NextResponse.redirect(`${origin}${redirectUrl}`)
        : forwardedHost
          ? NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
          : NextResponse.redirect(`${origin}${redirectUrl}`);

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
