import { toast } from 'sonner';
import { handleError } from '../error-handling';
import { withSupabase } from './api';

/**
 * Handles email/password Signup
 * This function is designed for client-side usage
 */
export const signupWithEmailPassword = async (
  email: string,
  password: string,
) => {
  return withSupabase(async (supabase) => {
    try {
      await supabase.auth.signUp({
        email,
        password,
      });

      toast.success(`Success! Please check your inbox and confirm your email.`);
      return true;
    } catch (error) {
      handleError('auth', {
        defaultMessage: 'Signup Failed',
        showToast: true,
      });
      return false;
    }
  });
};

/**
 * Resend verification email
 * This function is designed for client-side usage
 */
export const resendVerificationEmail = async (email: string) => {
  return withSupabase(async (supabase) => {
    try {
      await supabase.auth.resend({
        type: 'signup',
        email,
      });

      toast.success('Verification email resent!');
      return true;
    } catch (error) {
      handleError('auth', {
        defaultMessage: 'Failed to resend verification email',
        showToast: true,
      });
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
  return withSupabase(async (supabase) => {
    try {
      const { data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      window.location.href = '/organization';
      toast.success(`Welcome back to Trellsy`);

      return data;
    } catch (error) {
      handleError('auth', {
        defaultMessage: 'Login Failed',
        showToast: true,
      });
      return false;
    }
  });
};

/**
 * Handles Google OAuth login
 * This function is designed for client-side usage
 */
export const loginWithGoogleOAuth = async () => {
  return withSupabase(async (supabase) => {
    try {
      const state = Math.random().toString(36).substring(2, 15);

      sessionStorage.setItem('supabase_oauth_state', state);

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },

          scopes: 'email profile',
        },
      });

      // OAuth flow will handle redirect
      return true;
    } catch (error) {
      handleError('auth', {
        defaultMessage: 'Failed to login with Google',
        showToast: true,
      });
      return false;
    }
  });
};

/**
 * Handles user logout
 * This function is designed for client-side usage
 */
export const logout = async () => {
  return withSupabase(async (supabase) => {
    try {
      await supabase.auth.signOut();

      toast.success('Logged out successfully');

      window.location.href = '/auth/login';

      return true;
    } catch (error) {
      handleError('auth', {
        defaultMessage: 'Failed to logout',
        showToast: true,
      });
      return false;
    }
  });
};

/**
 * Gets the current authenticated user
 * This function is designed for client-side usage
 */
export const getCurrentUser = async () => {
  return withSupabase(async (supabase) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      return user;
    } catch (error) {
      handleError('auth', {
        showToast: true,
      });
      return false;
    }
  });
};
