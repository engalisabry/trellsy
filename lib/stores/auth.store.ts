import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { loginWithEmailPassword, loginWithGoogleOAuth, logout } from '../services/auth.service';

// Simplified auth store for UI state only - no sensitive data
interface AuthUIState {
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearErrors: () => void;
  clearState: () => void;
}

export const useAuthStore = create<AuthUIState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      isSuccess: false,
      error: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await loginWithEmailPassword(email, password);
          set({ isSuccess: true });
        } catch (error) {
          set({ error: error as Error, isSuccess: false });
        } finally {
          set({ isLoading: false });
        }
      },
      
      loginWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          await loginWithGoogleOAuth();
          // OAuth flow will handle redirect and session establishment
          set({ isSuccess: true });
        } catch (error) {
          set({ error: error as Error, isSuccess: false });
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          await logout();
          get().clearState();
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },
      
      clearErrors: () => set({ error: null }),
      
      clearState: () => set({
        isSuccess: false,
        error: null
      }),
    }),
    {
      name: 'auth-ui-store',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist non-sensitive UI state
      partialize: (state) => ({
        isLoading: state.isLoading,
        // Remove any sensitive authentication state from persistence
      }),
    }
  )
);

// Legacy compatibility - will be deprecated
export const useAuthStoreCompat = () => {
  const store = useAuthStore();
  return {
    ...store,
    // Map old property names for backward compatibility
    isAuthenticated: false, // Always false - use useAuth hook instead
  };
};
