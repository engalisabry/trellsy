import { createBrowserClient } from '@supabase/ssr';
import { createClient as createCoreClient } from '@supabase/supabase-js';

export function createClient(
  access_token?: string,
  p0?: string,
  p1?: {
    auth: {
      persistSession: boolean;
      autoRefreshToken: boolean;
      detectSessionInUrl: boolean;
    };
  },
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (access_token) {
    return createCoreClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}
