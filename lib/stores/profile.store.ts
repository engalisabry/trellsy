import { ProfileState } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { encryptData } from '@/lib/encryption';
import {
  fetchUserProfile,
  updateUserProfile,
} from '../services/profile.service';

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      userProfile: null,
      isLoading: false,
      isSuccess: false,
      error: null,

      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const profile = await fetchUserProfile();
          set({ userProfile: profile, isSuccess: true });
        } catch (error) {
          set({ error: error as Error, isSuccess: false });
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await updateUserProfile(data);

          // Update local state
          const currentProfile = set((state) => ({
            userProfile: state.userProfile
              ? { ...state.userProfile, ...data }
              : null,
            isSuccess: true,
          }));

          return currentProfile;
        } catch (error) {
          set({ error: error as Error, isSuccess: false });
        } finally {
          set({ isLoading: false });
        }
      },

      setUserProfile: (profile) => set({ userProfile: profile }),

      clearErrors: () => set({ error: null }),

      clearState: () =>
        set({
          userProfile: null,
          isSuccess: false,
          error: null,
        }),
    }),
    {
      name: 'profile-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        userProfile: encryptData(state.userProfile),
      }),
    },
  ),
);
