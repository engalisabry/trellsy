import { toast } from 'sonner';
import { getSupabaseClient, handleApiError } from './api';

/**
 * Handles email/password login
 */
export const loginWithEmailPassword = async (
  email: string,
  password: string,
) => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success(`Welcome back to Trellsy`);

    // Redirect to organization page after successful login
    window.location.href = '/organization';

    return data;
  } catch (error) {
    throw handleApiError(error, 'Login failed');
  }
};

/**
 * Handles Google OAuth login
 */
export const loginWithGoogleOAuth = async () => {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    // OAuth flow will handle redirect
    return true;
  } catch (error) {
    throw handleApiError(error, 'Google login failed');
  }
};

/**
 * Handles user logout
 */
export const logout = async () => {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success('Logged out successfully');

    // Redirect to login page after logout
    window.location.href = '/auth/login';

    return true;
  } catch (error) {
    throw handleApiError(error, 'Logout failed');
  }
};

/**
 * Gets the current authenticated user
 */
export const getCurrentUser = async () => {
  const supabase = getSupabaseClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};
