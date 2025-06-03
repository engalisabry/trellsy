import { toast } from 'sonner';
import { getSupabaseClient, handleApiError, withSupabase } from './api';

/**
 * Handles email/password Signup
 */
export const signupWithEmailPassword = async (
  email: string,
  password: string,
) => {
  const supabase = await getSupabaseClient();
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      handleApiError(error, 'Signup failed');
      return false;
    }

    toast.success(`Success! Please check your inbox and confirm your email.`);
    return true;
  } catch (error) {
    handleApiError(error, 'Signup failed');
    return false;
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (email: string) => {
  const supabase = await getSupabaseClient();
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      handleApiError(error, 'Failed to resend verification email');
      return false;
    }
    toast.success('Verification email resent!');
    return true;
  } catch (error) {
    handleApiError(error, 'Failed to resend verification email');
    return false;
  }
};

/**
 * Handles email/password login
 */
export const loginWithEmailPassword = async (
  email: string,
  password: string,
) => {
  const supabase = await getSupabaseClient();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      handleApiError(error, 'Login failed');
      return false;
    }

    window.location.href = '/organization';
    toast.success(`Welcome back to Trellsy`);

    return data;
  } catch (error) {
    handleApiError(error, 'Login failed');
  }
};

/**
 * Handles Google OAuth login
 */
export const loginWithGoogleOAuth = async () => {
  const supabase = await getSupabaseClient();
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
      handleApiError(error, 'Google login failed');
    }

    // OAuth flow will handle redirect
    return true;
  } catch (error) {
    handleApiError(error, 'Google login failed');
  }
};

/**
 * Handles user logout
 */
export const logout = async () => {
  const supabase = await getSupabaseClient();
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      handleApiError(error, 'Failed to logout');
    }

    toast.success('Logged out successfully');

    window.location.href = '/auth/login';

    return true;
  } catch (error) {
    handleApiError(error, 'Logout failed');
  }
};

/**
 * Gets the current authenticated user
 */
export const getCurrentUser = async () => {
  const supabase = await getSupabaseClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      handleApiError(error, 'Failed to get the user details');
      return;
    }

    return user;
  } catch (error) {
    handleApiError(error, 'Failed to get the user details');
    return;
  }
};
