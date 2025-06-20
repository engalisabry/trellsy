import type {
  Organization,
  OrganizationCreateInput,
  OrganizationInvitation,
  OrganizationState,
  OrganizationMember,
  OrganizationRole,
} from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  fetchUserOrganizationsAction,
  createOrganizationAction,
} from '@/actions/organization';
import {
  deleteOrganization as deleteOrg,
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
  inviteMember: (organization_id: string, email: string, role?: OrganizationRole) => Promise<void>;
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
          const result = await fetchUserOrganizationsAction();
          if (!result.success) throw new Error(result.error || 'Failed to fetch organizations');
          
          const { organizations, memberships } = result;
          if (!Array.isArray(organizations)) throw new Error('Invalid organizations data');
          
          // Ensure memberships is always an array and cast roles to OrganizationRole
          const membershipArray = Array.isArray(memberships) 
            ? memberships.map(m => ({
                ...m,
                role: m.role as OrganizationRole
              }))
            : [];
          
          set({ 
            organizations, 
            memberships: membershipArray, 
            isSuccess: true,
            // Update current organization if it no longer exists
            currentOrganization: get().currentOrganization 
              ? organizations.find(o => o.id === get().currentOrganization?.id) || null
              : null
          });
          return { organizations, memberships: membershipArray };
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
          const formData = new FormData();
          formData.append('name', props.name);
          formData.append('slug', props.slug);
          if (props.logo) {
            formData.append('logo', props.logo);
          }
          
          const result = await createOrganizationAction(formData);
          if (!result.success) {
            throw new Error(result.error || 'Failed to create organization');
          }
          
          const { organizations } = await get().fetchOrganizations();
          set({ isSuccess: true });
          // Return the newly created organization
          return result.organization || false;
        } catch (error) {
          set({ error: error as Error, isSuccess: false });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      hasRole: (organizationId: string, role: string) => {
        const membership = get().memberships.find(
          (m: OrganizationMember) => m.organization_id === organizationId
        );
        return membership?.role === role;
      },

      isMember: (organizationId: string) => {
        return get().memberships.some(
          (m: OrganizationMember) => m.organization_id === organizationId
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
          const updatedOrgs = currentOrgs.map((org: Organization) =>
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
          const filteredOrgs = currentOrgs.filter((org: Organization) => org.id !== id);

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

      inviteMember: async (organization_id, email, role: OrganizationRole = 'member') => {
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
            (inv: OrganizationInvitation) => inv.id === invitation_id,
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
            (inv: OrganizationInvitation) => inv.id === invitation_id,
          )?.organization_id;
          if (orgId) await get().fetchInvitations(orgId);
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentOrganization: (slug: string) => {
        const org = get().organizations.find((o: Organization) => o.slug === slug);
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
        organizations: state.organizations,
        memberships: state.memberships,
        invitations: state.invitations,
        currentOrganization: state.currentOrganization,
      }),
      merge: (persistedState: any, currentState: OrganizationStore) => ({
        ...currentState,
        organizations: Array.isArray(persistedState.organizations) 
          ? persistedState.organizations 
          : [],
        memberships: Array.isArray(persistedState.memberships)
          ? persistedState.memberships
          : [],
        invitations: Array.isArray(persistedState.invitations)
          ? persistedState.invitations
          : [],
        currentOrganization: persistedState.currentOrganization
          ? persistedState.currentOrganization
          : null,
      }),
    },
  ),
);
