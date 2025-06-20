import { useEffect } from 'react';
import type { AuthState } from '@/types';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { create } from 'zustand';
import {
  signInWithEmail,
  signInWithGoogle,
  signOut,
} from '../lib/auth/actions';
import { createClient } from '../lib/supabase/client';

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  initialized: false,
  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithEmail(email, password);
      if (result.success) {
        return true;
      } else {
        const errorMessage = result.error || 'Login failed';
        set({ error: errorMessage });
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      const errorMessage = 'Login failed';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        return true;
      } else {
        const errorMessage = result.error || 'Google login failed';
        set({ error: errorMessage });
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      const errorMessage = 'Google login failed';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      await signOut();
      set({ user: null, session: null, loading: false });
    } catch (error) {
      set({ error: 'Logout failed', loading: false });
    }
  },

  syncUserProfile: async (user: User) => {
    // This can be implemented later if needed
  },

  initialize: async () => {
    if (get().initialized) return;

    const supabase = createClient();

    // Get initial session
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ 
        user: session?.user ?? null, 
        session: session,
        loading: false, 
        initialized: true 
      });
    } catch (error) {
      set({
        error: 'Failed to initialize auth',
        loading: false,
        initialized: true,
      });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      set({ 
        user: session?.user ?? null, 
        session: session,
        loading: false 
      });
    });
  },
}));

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.initialize();
  }, [store]);

  return store;
}

export function useUser() {
  const { user, loading } = useAuth();
  return { user, loading, error: null };
}

export function useSession() {
  const { user, loading } = useAuth();
  const session = user ? { user } : null;
  return {
    session,
    loading,
    error: null,
    refresh: async () => {},
  };
}

export function clearAuthCache() {
  console.log('clearAuthCache called - no-op');
}
