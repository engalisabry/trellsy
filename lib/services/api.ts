import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '../supabase/server';
import { handleError } from '../error-handling';

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
    return handleError(
      new Error('Authentication required'),
      {
        category: 'auth',
        defaultMessage: 'Please sign in to continue',
        showToast: true,
        throwError: true,
      }
    ) as never;
  }

  // Verify token validity
  const { error: authError } = await supabase.auth.getUser();
  if (authError) {
    return handleError(
      authError,
      {
        category: 'auth',
        defaultMessage: 'Session expired. Please sign in again.',
        showToast: true,
        throwError: true,
      }
    ) as never;
  }

  try {
    return await callback(supabase, session.user.id);
  } catch (error) {
    throw error; // Let caller handle with handleError
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return handleError(
        authError,
        {
          category: 'auth',
          defaultMessage: 'Authentication failed',
          showToast: true,
          throwError: true,
        }
      ) as never;
    }
    
    return await callback(supabase, user?.id);
  } catch (error) {
    throw error; // Let caller handle with handleError
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
    throw error; // Let caller handle with handleError
  }
};

/**
 * Simplified client-side wrapper that doesn't require authentication
 * Use for public operations or when authentication is optional
 */
export const withSupabasePublic = async <T>(
  callback: (supabase: SupabaseClient) => Promise<T>,
): Promise<T> => {
  const supabase = createClient();
  return await callback(supabase);
};

/**
 * @deprecated Use handleError from error-handling.ts instead
 */
export const handleApiError = (
  error: unknown,
  defaultMessage: string = 'An error occurred',
  options?: {
    throwError?: boolean;
    context?: Record<string, unknown>;
  }
) => {
  console.warn('handleApiError is deprecated. Use handleError from error-handling.ts instead.');
  return handleError(error, {
    defaultMessage,
    throwError: options?.throwError ?? false,
    context: options?.context,
  });
};
