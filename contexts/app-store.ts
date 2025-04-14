import type { Organization, UserProfile } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { decryptData, encryptData } from '@/lib/encryption';

interface AppStoreState {
  organizations: Organization[];
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  setOrganizations: (organizations: Organization[]) => void;
  setUserProfile: (profile: UserProfile) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  clearStore: () => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set) => ({
      organizations: [],
      userProfile: null,
      isLoading: false,
      error: null,
      setOrganizations: (organizations) => set({ organizations }),
      setUserProfile: (userProfile) => set({ userProfile }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearStore: () => set({ organizations: [], userProfile: null }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        organizations: encryptData(state.organizations),
        userProfile: encryptData(state.userProfile),
      }),
    },
  ),
);
