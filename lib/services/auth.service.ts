import { toast } from 'sonner';
import { handleApiError, withSupabase, withSupabaseClient, withSupabaseAuth } from './api';

/**
 * Handles email/password Signup
 * This function is designed for client-side usage
 */
export const signupWithEmailPassword = async (
  email: string,
  password: string,
) => {
  return withSupabaseAuth(async (supabase) => {
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
  });
};

/**
 * Resend verification email
 * This function is designed for client-side usage
 */
export const resendVerificationEmail = async (email: string) => {
  return withSupabaseAuth(async (supabase) => {
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
  });
};

/**
 * Handles email/password login
 * This function is designed for client-side usage
 */
export const loginWithEmailPassword = async (
  email: string,
  password: string,
) => {
  return withSupabaseAuth(async (supabase) => {
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
      return false;
    }
  });
};

/**
 * Handles Google OAuth login
 * This function is designed for client-side usage
 */
export const loginWithGoogleOAuth = async () => {
  return withSupabaseAuth(async (supabase) => {
    try {
      console.log('Starting Google OAuth login...');
      console.log('Redirect URL:', `${window.location.origin}/auth/callback`);
      
      // Generate a random state to secure the OAuth flow
      const state = Math.random().toString(36).substring(2, 15);
      
      // Store state in sessionStorage to verify on callback
      sessionStorage.setItem('supabase_oauth_state', state);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Include the state in the OAuth flow
          scopes: 'email profile',
        },
      });
      
      console.log('OAuth response:', { error, data });

      if (error) {
        handleApiError(error, 'Google login failed');
        return false;
      }

      // OAuth flow will handle redirect
      return true;
    } catch (error) {
      handleApiError(error, 'Google login failed');
      return false;
    }
  });
};

/**
 * Handles user logout
 * This function is designed for client-side usage
 */
export const logout = async () => {
  return withSupabaseAuth(async (supabase) => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        handleApiError(error, 'Failed to logout');
        return false;
      }

      toast.success('Logged out successfully');

      window.location.href = '/auth/login';

      return true;
    } catch (error) {
      handleApiError(error, 'Logout failed');
      return false;
    }
  });
};

/**
 * Gets the current authenticated user
 * This function is designed for client-side usage
 */
export const getCurrentUser = async () => {
  return withSupabaseClient(async (supabase) => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        handleApiError(error, 'Failed to get the user details');
        return null;
      }

      return user;
    } catch (error) {
      handleApiError(error, 'Failed to get the user details');
      return null;
    }
  });
};
