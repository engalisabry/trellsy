import { createBrowserClient } from '@supabase/ssr';
import { createClient as createCoreClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for browser/client-side usage
 * @param access_token Optional access token for authenticated requests
 */
export function createClient(access_token?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // For authenticated requests with explicit token
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

  // Standard browser client with automatic session management
  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}
