import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Create a reusable Supabase client
export const getSupabaseClient = () => {
  return createClient();
};

// Helper for handling API errors consistently
export const handleApiError = (error: unknown, defaultMessage: string = 'An error occurred') => {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  toast.error(errorMessage);
  return new Error(errorMessage);
};
