import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { handleError } from '../error-handling';
import { getSession } from '../supabase/server';

/**
 * Get Supabase client for server-side operations
 */
export const getSupabaseClient = async () => {
  const session = await getSession();
  return createClient(session?.access_token);
};

/**
 * Server-side Higher-Order Function for authenticated Supabase operations
 * Use in server components, server actions, and API routes
 */
export const withSupabase = async <T>(
  callback: (supabase: SupabaseClient, userId: string) => Promise<T>,
): Promise<T> => {
  const session = await getSession();
  const supabase = createClient(session?.access_token);

  if (!session?.user?.id) {
    return handleError(new Error('Authentication required'), {
      defaultMessage: 'Authentication required',
      showToast: true,
      throwError: true,
      context: { category: 'auth' },
    }) as never;
  }

  const userId = session.user?.id;
  if (!userId) {
    return handleError(new Error('User ID not found in session'), {
      defaultMessage: 'User ID not found',
      showToast: true,
      throwError: true,
    }) as never;
  }

  const { error: authError } = await supabase.auth.getUser();
  if (authError) {
    return handleError(authError, {
      defaultMessage: 'Authentication failed',
      showToast: true,
      throwError: true,
      context: { category: 'auth' },
    }) as never;
  }

  try {
    return await callback(supabase, session.user.id);
  } catch (error) {
    throw error;
  }
};

/**
 * Client-side Higher-Order Function for authenticated operations
 * Use in client components that require authentication
 */
export const withSupabaseClient = async <T>(
  callback: (supabase: SupabaseClient, userId?: string) => Promise<T>,
): Promise<T> => {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return handleError(authError, {
        defaultMessage: 'Authentication failed',
        showToast: true,
        throwError: true,
        context: { category: 'auth' },
      }) as never;
    }

    return await callback(supabase, user?.id);
  } catch (error) {
    throw error;
  }
};

/**
 * Client-side Higher-Order Function for authentication operations
 * Use for login, signup, password reset, etc. (operations that don't require existing session)
 */
export const withSupabaseAuth = async <T>(
  callback: (supabase: SupabaseClient) => Promise<T>,
): Promise<T> => {
  const supabase = createClient();

  try {
    return await callback(supabase);
  } catch (error) {
    throw error;
  }
};

/**
 * Simplified client-side wrapper that doesn't require authentication
 * For public operations or when authentication is optional
 */
export const withSupabasePublic = async <T>(
  callback: (supabase: SupabaseClient) => Promise<T>,
): Promise<T> => {
  const supabase = createClient();
  return await callback(supabase);
};
