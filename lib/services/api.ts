import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '../supabase/server';
import { handleError } from '../error-handling';

export const getSupabaseClient = async () => {
  const session = await getSession();
  return createClient(session?.access_token);
};

// export const withSupabase = async <T>(
//   operation: (supabase: any, userId: string) => Promise<T>,
// ): Promise<T> => {
//   const supabase = await getSupabaseClient();

//   const {
//     data: { user },
//     error,
//   } = await supabase.auth.getUser();

//   if (error || !user) {
//     console.error('Authentication error:', error);
//     toast.error('Authentication failed. Please log in.');
//     throw new Error('Not authenticated');
//   }

//   const userId = user.id.toString();
//   if (!userId) {
//     toast.error('Invalid user ID');
//     throw new Error('Invalid user ID');
//   }

//   return operation(supabase, userId);
// };

export const withSupabase = async <T>(
  callback: (supabase: SupabaseClient, userId: string) => Promise<T>,
): Promise<T> => {
  // Create client with server-side session
  const session = await getSession();
  const supabase = createClient(session?.access_token);

  if (!session) {
    return handleError(
      new Error('No session available'),
      {
        defaultMessage: 'Authentication required',
        showToast: true,
        throwError: true,
      }
    ) as never;
  }

  const userId = session.user?.id;
  if (!userId) {
    return handleError(
      new Error('User ID not found in session'),
      {
        defaultMessage: 'User ID not found',
        showToast: true,
        throwError: true,
      }
    ) as never;
  }

  // Verify the token is still valid
  const { error: authError } = await supabase.auth.getUser();
  if (authError) {
    return handleError(
      authError,
      {
        defaultMessage: 'Authentication failed',
        showToast: true,
        throwError: true,
      }
    ) as never;
  }

  try {
    return await callback(supabase, userId);
  } catch (error) {
    // Pass through to the caller who should handle this with handleError
    throw error;
  }
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
  return handleError(error, {
    defaultMessage,
    throwError: options?.throwError ?? false,
    context: options?.context,
  });
};
