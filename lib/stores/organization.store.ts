import type { OrganizationCreateInput, OrganizationState } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { encryptData } from '@/lib/encryption';
import {
  createOrganization as createOrg,
  deleteOrganization as deleteOrg,
  fetchUserOrganizations,
  updateOrganization as updateOrg,
} from '../services/organization.service';

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      organizations: [],
      memberships: [],
      isLoading: false,
      isSuccess: false,
      error: null,

      fetchOrganizations: async () => {
        set({ isLoading: true, error: null });
        try {
          const { organizations, memberships } = await fetchUserOrganizations();
          set({ organizations, memberships, isSuccess: true });
          return { organizations, memberships };
        } catch (error) {
          set({ error: error as Error, isSuccess: false });
          return { organizations: [], memberships: [] };
        } finally {
          set({ isLoading: false });
        }
      },

      createOrganization: async (props: OrganizationCreateInput) => {
        set({ isLoading: true, error: null });
        try {
          const newOrg = await createOrg(props);
          await get().fetchOrganizations();
          set({ isSuccess: true });
          return newOrg;
        } catch (error) {
          set({ error: error as Error, isSuccess: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // In organization.store.ts
      updateOrganization: async (
        id: string,
        data: Partial<OrganizationCreateInput>,
      ) => {
        set({ isLoading: true, error: null });
        try {
          await updateOrg(id, data);

          const currentOrgs = get().organizations;
          const updatedOrgs = currentOrgs.map((org) =>
            org.id === id ? { ...org, ...data } : org,
          );

          set({ organizations: updatedOrgs, isSuccess: true });
        } catch (error) {
          set({ error: error as Error, isSuccess: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteOrganization: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await deleteOrg(id);

          // Update local state
          const currentOrgs = get().organizations;
          const filteredOrgs = currentOrgs.filter((org) => org.id !== id);

          set({ organizations: filteredOrgs, isSuccess: true });
        } catch (error) {
          set({ error: error as Error, isSuccess: false });
        } finally {
          set({ isLoading: false });
        }
      },

      setOrganizations: (organizations) => {
        set({ organizations });
      },

      clearErrors: () => set({ error: null }),

      clearState: () =>
        set({
          organizations: [],
          memberships: [],
          isSuccess: false,
          error: null,
        }),
    }),
    {
      name: 'organization-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        organizations: encryptData(state.organizations),
        memberships: encryptData(state.memberships),
      }),
    },
  ),
);
