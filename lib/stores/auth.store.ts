import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { loginWithEmailPassword, loginWithGoogleOAuth, logout } from '../services/auth.service';
import { encryptData } from '@/lib/encryption';

interface AuthState {
  isAuthenticated: boolean;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      isSuccess: false,
      error: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await loginWithEmailPassword(email, password);
          set({ isAuthenticated: true, isSuccess: true });
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
          set({ isAuthenticated: true, isSuccess: true });
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
        isAuthenticated: false,
        isSuccess: false,
        error: null
      }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isAuthenticated: encryptData(state.isAuthenticated),
      }),
    }
  )
);
