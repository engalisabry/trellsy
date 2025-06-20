import { createClient } from '../supabase/client';

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function signInWithGoogle(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: new URL(
          '/auth/callback',
          window.location.origin,
        ).toString(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function signOut(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function resetPassword(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: new URL(
        '/auth/update-password',
        window.location.origin,
      ).toString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function signupWithEmailPassword(
  email: string,
  password: string,
): Promise<boolean> {
  const result = await signUpWithEmail(email, password);
  return result.success;
}

export async function resendVerificationEmail(email: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      console.error('Verification email error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Verification email error:', error);
    return false;
  }
}
