import { create } from 'zustand';
import { useAuthStore } from './auth.store';
import { useOrganizationStore } from './organization.store';
import { useProfileStore } from './profile.store';

export const useStore = create(() => ({
  auth: useAuthStore,
  organization: useOrganizationStore,
  profile: useProfileStore,

  resetAllStores: () => {
    useAuthStore.getState().clearState();
    useOrganizationStore.getState().clearState();
    useProfileStore.getState().clearState();
  },

  refreshAllData: async () => {
    try {
      await useProfileStore.getState().fetchProfile();
      await useOrganizationStore.getState().fetchOrganizations();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  },
}));

// Re-export individual stores for direct access if needed
export { useAuthStore as useOldAuthStore } from './auth.store'; // Keep for compatibility
export {
  useAuth,
  useUser,
  useSession,
  clearAuthCache,
  useAuthStore,
} from '../../hooks/use-auth';
export { useOrganizationStore } from './organization.store';
export { useProfileStore } from './profile.store';
