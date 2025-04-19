'use server';

import { cookies } from 'next/headers';
import { type CookieOptions, createServerClient } from '@supabase/ssr';

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
  };
};

const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            throw Error(
              error instanceof Error ? error.message : 'Something went wrong',
            );
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            throw Error(
              error instanceof Error ? error.message : 'Something went wrong',
            );
          }
        },
      },
    },
  );
};

// Export the function with both names for compatibility
export const createClient = createServerSupabaseClient;
export { createServerSupabaseClient };

export const getSession = async (): Promise<Session | null> => {
  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (userError || !userData.user || sessionError || !sessionData.session) {
    return null;
  }

  return {
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    expires_in: sessionData.session.expires_in,
    token_type: sessionData.session.token_type,
    user: {
      id: userData.user.id,
      email: userData.user.email || '',
    },
  };
};
