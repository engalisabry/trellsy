import { create } from 'zustand';
import { signInWithEmail, signInWithGoogle, signOut } from '../auth/actions';

// Simplified auth store for UI loading states only
interface AuthUIState {
  isLoading: boolean;
  error: string | null;

  // Actions that delegate to new auth system
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearErrors: () => void;
  clearState: () => void;
}

export const useAuthStore = create<AuthUIState>()((set) => ({
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await signInWithEmail(email, password);
      if (result.success) {
        return true;
      } else {
        set({ error: result.error || 'Login failed' });
        return false;
      }
    } catch (error) {
      set({ error: 'Login failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        return true;
      } else {
        set({ error: result.error || 'Google login failed' });
        return false;
      }
    } catch (error) {
      set({ error: 'Google login failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await signOut();
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Logout failed', isLoading: false });
    }
  },

  clearErrors: () => set({ error: null }),

  clearState: () => set({ error: null }),
}));

// Backward compatibility
export const useAuthStoreCompat = () => {
  const store = useAuthStore();
  return {
    ...store,
    isSuccess: !store.error && !store.isLoading,
    isAuthenticated: false, // This should come from useAuth() now
  };
};
