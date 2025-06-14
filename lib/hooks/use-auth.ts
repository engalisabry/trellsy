'use client';

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

let cachedSession: Session | null = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const supabase = createClient();

    // Check cache first
    const now = Date.now();
    if (cachedSession && now < cacheExpiry) {
      setState({
        user: cachedSession.user,
        session: cachedSession,
        loading: false,
        error: null,
      });
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
        return;
      }

      // Update cache
      cachedSession = session;
      cacheExpiry = now + CACHE_DURATION;

      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Clear cache on auth changes
      cachedSession = null;
      cacheExpiry = 0;

      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

// Helper hooks for common use cases
export function useUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}

export function useSession() {
  const { session, loading } = useAuth();
  return { session, loading };
}

// Clear session cache manually if needed
export function clearAuthCache() {
  cachedSession = null;
  cacheExpiry = 0;
}

