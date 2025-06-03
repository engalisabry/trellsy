import type {
  Organization,
  OrganizationCreateInput,
  OrganizationInvitation,
  OrganizationState,
  OrganizationMember,
} from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { encryptData, decryptData } from '@/lib/encryption';
import {
  createOrganization as createOrg,
  deleteOrganization as deleteOrg,
  fetchUserOrganizations,
  inviteToOrganization,
  listOrganizationInvitations,
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
  updateOrganization as updateOrg,
} from '../services/organization.service';

interface OrganizationStore extends OrganizationState {
  invitations: OrganizationInvitation[];
  currentOrganization: Organization | null;
  fetchInvitations: (organization_id: string) => Promise<void>;
  inviteMember: (organization_id: string, email: string, role?: string) => Promise<void>;
  resendInvitation: (invitation_id: string) => Promise<void>;
  revokeInvitation: (invitation_id: string) => Promise<void>;
  setCurrentOrganization: (slug: string) => void;
  hasRole: (organizationId: string, role: string) => boolean;
  isMember: (organizationId: string) => boolean;
}

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set, get) => ({
      organizations: [],
      memberships: [],
      invitations: [],
      currentOrganization: null,
      isLoading: false,
      isSuccess: false,
      error: null,

      fetchOrganizations: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await fetchUserOrganizations();
          if (!result) throw new Error('Failed to fetch organizations');
          
          const { organizations, memberships } = result;
          if (!Array.isArray(organizations)) throw new Error('Invalid organizations data');
          
          set({ 
            organizations, 
            memberships, 
            isSuccess: true,
            // Update current organization if it no longer exists
            currentOrganization: get().currentOrganization 
              ? organizations.find(o => o.id === get().currentOrganization?.id) || null
              : null
          });
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
          if (!newOrg) throw new Error('Failed to create organization');
          
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

      hasRole: (organizationId: string, role: string) => {
        const membership = get().memberships.find(
          m => m.organization_id === organizationId
        );
        return membership?.role === role;
      },

      isMember: (organizationId: string) => {
        return get().memberships.some(
          m => m.organization_id === organizationId
        );
      },

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

      fetchInvitations: async (organization_id) => {
        set({ isLoading: true, error: null });
        try {
          const invitations =
            await listOrganizationInvitations(organization_id);
          set({ invitations: Array.isArray(invitations) ? invitations : [] });
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      inviteMember: async (organization_id, email, role = 'member') => {
        set({ isLoading: true, error: null });
        try {
          await inviteToOrganization(organization_id, email, role);
          await get().fetchInvitations(organization_id);
        } catch (error) {
          set({ error: error as Error });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resendInvitation: async (invitation_id) => {
        set({ isLoading: true, error: null });
        try {
          await resendOrganizationInvitation(invitation_id);
          // Find the org_id for this invitation
          const orgId = get().invitations.find(
            (inv) => inv.id === invitation_id,
          )?.organization_id;
          if (orgId) await get().fetchInvitations(orgId);
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      revokeInvitation: async (invitation_id) => {
        set({ isLoading: true, error: null });
        try {
          await revokeOrganizationInvitation(invitation_id);
          const orgId = get().invitations.find(
            (inv) => inv.id === invitation_id,
          )?.organization_id;
          if (orgId) await get().fetchInvitations(orgId);
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentOrganization: (slug: string) => {
        const org = get().organizations.find((o) => o.slug === slug);
        if (!org) {
          console.warn(`Organization with slug ${slug} not found`);
          set({ currentOrganization: null });
          return;
        }
        set({ currentOrganization: org });
      },

      setOrganizations: (organizations: Organization[]) => {
        if (!Array.isArray(organizations)) {
          console.error('Invalid organizations data provided to setOrganizations');
          return;
        }
        set({ organizations });
      },

      clearErrors: () => set({ error: null }),

      clearState: () =>
        set({
          organizations: [],
          memberships: [],
          invitations: [],
          currentOrganization: null,
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
        invitations: encryptData(state.invitations),
        currentOrganization: encryptData(state.currentOrganization),
      }),
      merge: (persistedState: any, currentState: OrganizationStore) => ({
        ...currentState,
        organizations: Array.isArray(persistedState.organizations) 
          ? decryptData(persistedState.organizations) 
          : [],
        memberships: Array.isArray(persistedState.memberships)
          ? decryptData(persistedState.memberships)
          : [],
        invitations: Array.isArray(persistedState.invitations)
          ? decryptData(persistedState.invitations)
          : [],
        currentOrganization: persistedState.currentOrganization
          ? decryptData(persistedState.currentOrganization)
          : null,
      }),
    },
  ),
);
