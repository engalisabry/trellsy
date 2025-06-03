import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '../supabase/server';

export const getSupabaseClient = async () => {
  const session = await getSession();
  return createClient(session?.access_token);
};

export const withSupabase = async <T>(
  operation: (supabase: any, userId: string) => Promise<T>,
): Promise<T> => {
  const supabase = await getSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Authentication error:', error);
    toast.error('Authentication failed. Please log in.');
    throw new Error('Not authenticated');
  }

  const userId = user.id.toString();
  if (!userId) {
    toast.error('Invalid user ID');
    throw new Error('Invalid user ID');
  }

  return operation(supabase, userId);
};

export const handleApiError = (
  error: unknown,
  defaultMessage: string = 'An error occurred',
) => {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  toast.error(errorMessage);
  return new Error(errorMessage);
};
