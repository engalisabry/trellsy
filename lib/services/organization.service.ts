import { redirect } from 'next/navigation';
import type {
  ApiError,
  Organization,
  OrganizationCreateInput,
  OrganizationInvitation,
  OrganizationMember,
} from '@/types';
import { toast } from 'sonner';
import { z } from 'zod';
import { handleApiError, withSupabase } from './api';

// Validation schemas
// const organizationSchema = z.object({
//   name: z.string().min(1, 'Name is required').max(100),
//   slug: z
//     .string()
//     .min(3, 'Slug must be at least 3 characters')
//     .max(50, 'Slug must be less than 50 characters')
//     .regex(
//       /^[a-z0-9-]+$/,
//       'Slug can only contain lowercase letters, numbers, and hyphens',
//     ),

//   logo_url: z.string().url().optional(),
// });

/**
 * Creates a new organization with validation
 */
export const createOrganization = async (
  props: OrganizationCreateInput & { logo?: File },
) => {
  return withSupabase(async (supabase, userId) => {
    try {
      // Create organization with auth context
      const { data: orgData, error: orgError } = await supabase
        .from('Organization')
        .insert({
          name: props.name,
          slug: props.slug,
          created_by: userId,
          logo_url: props.logo_url,
        })
        .select()
        .single();

      if (orgError) toast.error('Failed to create organization');

      // Add user as owner with auth context
      const { error: memberError } = await supabase
        .from('OrganizationMembers')
        .insert({
          organization_id: orgData.id,
          profile_id: userId,
          role: 'owner',
        });

      if (memberError) toast.error('Failed to add user as owner');

      return orgData;
    } catch (error) {
      toast.error('Something went wrong');
      throw error;
    }
  });
};

/**
 * Fetches all organizations for the current user
 * @returns {Promise<{ organizations: Organization[]; memberships: OrganizationMember[] }>}
 */

export const fetchUserOrganizations = async (): Promise<{
  organizations: Organization[];
  memberships: OrganizationMember[];
}> => {
  return withSupabase(async (supabase, userId) => {
    if (!userId) throw new Error('User ID is required');

    try {
      const [orgsResult, membershipsResult] = await Promise.all([
        supabase.from('Organization').select('*').eq('created_by', userId),
        supabase
          .from('OrganizationMembers')
          .select('*, organization:Organization(*)')
          .eq('profile_id', userId),
      ]);

      if (orgsResult.error) throw orgsResult.error;
      if (membershipsResult.error) throw membershipsResult.error;

      const organizations = orgsResult.data || [];
      const memberships = membershipsResult.data || [];

      return { organizations, memberships };
    } catch (error) {
      handleApiError(error);
      return { organizations: [], memberships: [] };
    }
  });
};

/**
 * Updates an organization
 */
export const updateOrganization = async (
  id: string,
  updates: Partial<Organization>,
) => {
  return withSupabase(async (supabase, userId) => {
    try {
      const { data, error } = await supabase
        .from('Organization')
        .update(updates)
        .eq('id', id)
        .eq('created_by', userId)
        .select()
        .single();

      if (error) {
        handleApiError(error, 'Failed to update organization');
        return false;
      }

      return data;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  });
};

/**
 * Deletes an organization
 */
export const deleteOrganization = async (id: string) => {
  return withSupabase(async (supabase, userId) => {
    try {
      const { error } = await supabase
        .from('Organization')
        .delete()
        .eq('id', id)
        .eq('created_by', userId);

      if (error) {
        handleApiError(error, 'Failed to delete organization');
        return false;
      }

      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  });
};

/**
 * Organization Invitations
 */

// Invite a user to an organization
export const inviteToOrganization = async (
  organization_id: string,
  email: string,
  role: string = 'member',
) => {
  return withSupabase(async (supabase, userId) => {
    try {
      // Generate a unique token for the invitation
      const token = crypto.randomUUID();

      const { data, error } = await supabase
        .from('OrganizationInvitations')
        .insert({
          organization_id,
          email,
          role,
          invited_by: userId,
          status: 'pending',
          token,
        })
        .select()
        .single();

      if (error) {
        handleApiError(error, 'Failed to delete organization');
        return false;
      }

      return data as OrganizationInvitation;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  });
};

// List all invitations for an organization
export const listOrganizationInvitations = async (organization_id: string) => {
  return withSupabase(async (supabase) => {
    try {
      const { data, error } = await supabase
        .from('OrganizationInvitations')
        .select('*')
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        handleApiError(error, "Can't get invitations list");
        return error;
      }

      return (Array.isArray(data) ? data : []) as OrganizationInvitation[];
    } catch (error) {
      handleApiError(error);
      return false;
    }
  });
};

// Resend invitation (regenerate token, set status to pending, clear accepted/revoked)
export const resendOrganizationInvitation = async (invitation_id: string) => {
  return withSupabase(async (supabase) => {
    try {
      const token = crypto.randomUUID();
      const { data, error } = await supabase
        .from('OrganizationInvitations')
        .update({
          token,
          status: 'pending',
          accepted_at: null,
          revoked_at: null,
        })
        .eq('id', invitation_id)
        .select()
        .single();

      if (error) {
        handleApiError(error, 'Failed to resend invitaion');
        return false;
      }

      return data as OrganizationInvitation;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  });
};

// Revoke invitation
export const revokeOrganizationInvitation = async (invitation_id: string) => {
  return withSupabase(async (supabase) => {
    try {
      const { data, error } = await supabase
        .from('OrganizationInvitations')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        })
        .eq('id', invitation_id)
        .select()
        .single();

      if (error) {
        handleApiError(error, 'Failed revoke invitaion');
        return false;
      }

      return data as OrganizationInvitation;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  });
};

// Accept invitation by token
export const acceptOrganizationInvitation = async (
  token: string,
  profile_id: string,
) => {
  return withSupabase(async (supabase) => {
    try {
      const { data: invite, error: inviteError } = await supabase
        .from('OrganizationInvitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invite) {
        handleApiError(inviteError, "Can't get invitations");
        return false;
      }

      // Add the user as a member
      const { error: memberError } = await supabase
        .from('OrganizationMembers')
        .insert({
          organization_id: invite.organization_id,
          profile_id,
          role: invite.role,
        });

      if (memberError) {
        handleApiError(
          memberError,
          'Failed to add initer as organnization member',
        );
        return false;
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('OrganizationInvitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      if (updateError) {
        handleApiError(updateError, 'Failed to update status of invitation');
        return false;
      }

      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  });
};
