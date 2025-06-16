import type {
  Organization,
  OrganizationCreateInput,
  OrganizationInvitation,
  OrganizationMember,
} from '@/types';
import { handleError } from '@/lib/error-handling';
import { withSupabase } from './api';
import { uploadFile } from './file-upload.service';

/**
 * Creates a new organization with validation
 */
export const createOrganization = async (
  props: OrganizationCreateInput & { logo?: File },
): Promise<Organization | false> => {
  return withSupabase(async (supabase, userId) => {
    try {
      if (!userId) {
        handleError('auth', {
          showToast: true,
        });
      }

      // Handle logo upload
      let logo_url = props.logo_url;
      if (props.logo && props.logo instanceof File) {
        try {
          logo_url = await uploadFile(props.logo, 'organization-logos');
        } catch (error) {
          handleError('unknown');
        }
      }

      const insertData = {
        name: props.name,
        slug: props.slug,
        created_by: userId.toString(),
        logo_url,
      };

      const insertQuery = supabase
        .from('Organization')
        .insert(insertData)
        .select()
        .single();

      const { data: orgData, error: orgError } = await insertQuery;

      if (orgError) {
        console.error('Organization creation failed:', orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      if (!orgData) {
        throw new Error('Organization creation returned no data');
      }

      return orgData;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to create organization',
        context: { action: 'createOrganization', props },
        showToast: true,
      });
      return false;
    }
  });
};

export const checkSlugAvailability = async (slug: string): Promise<boolean> => {
  return withSupabase(async (supabase) => {
    try {
      const { data, error } = await supabase
        .from('Organization')
        .select('id')
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') {
        handleError(error, {
          defaultMessage: 'Error checking slug availability',
          showToast: true,
          context: { action: 'checkSlugAvailability', slug },
        });
        return false;
      }

      return !data;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Unexpected error checking slug availability',
        context: { action: 'checkSlugAvailability', slug },
        showToast: true,
        throwError: true,
      });
      return false;
    }
  });
};

/**
 * Fetches all organizations for the current user (Server-side)
 * @returns {Promise<{ organizations: Organization[]; memberships: OrganizationMember[] }>}
 */
export const fetchUserOrganizationsServer = async (): Promise<{
  organizations: Organization[];
  memberships: OrganizationMember[];
}> => {
  return withSupabase(async (supabase, userId) => {
    if (!userId) {
      handleError('auth', {
        showToast: true,
      });
    }

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
      handleError(error, {
        defaultMessage: 'Failed to fetch organizations',
        context: { action: 'fetchUserOrganizations' },
        showToast: true,
      });
      return { organizations: [], memberships: [] };
    }
  });
};

/**
 * Fetches all organizations for the current user (Client-side)
 * @returns {Promise<{ organizations: Organization[]; memberships: OrganizationMember[] }>}
 */
export const fetchUserOrganizations = async (): Promise<{
  organizations: Organization[];
  memberships: OrganizationMember[];
}> => {
  return withSupabase(async (supabase, userId) => {
    try {
      if (userId) {
        handleError('auth', {
          showToast: true,
        });
      }

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
      handleError(error, {
        defaultMessage: 'Failed to fetch organizations',
        context: { action: 'fetchUserOrganizations' },
        showToast: true,
      });
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
        handleError(error, {
          defaultMessage: 'Failed to update organization',
          context: { action: 'updateOrganization', id },
          showToast: true,
        });
        return false;
      }

      return data;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to update organization',
        context: { action: 'updateOrganization', id },
        showToast: true,
      });
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
        handleError(error, {
          defaultMessage: 'Failed to delete organization',
          context: { action: 'deleteOrganization', id },
          showToast: true,
        });
        return false;
      }

      return true;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to delete organization',
        context: { action: 'deleteOrganization', id },
        showToast: true,
      });
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
        handleError(error, {
          defaultMessage: 'Failed to create organization invitation',
          context: { action: 'inviteToOrganization', organization_id, email },
          showToast: true,
        });
        return false;
      }

      return data as OrganizationInvitation;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to create organization invitation',
        context: { action: 'inviteToOrganization', organization_id, email },
        showToast: true,
      });
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
        handleError(error, {
          defaultMessage: "Can't get invitations list",
          context: { action: 'listOrganizationInvitations', organization_id },
          showToast: true,
        });
        return error;
      }

      return (Array.isArray(data) ? data : []) as OrganizationInvitation[];
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to get invitations list',
        context: { action: 'listOrganizationInvitations', organization_id },
        showToast: true,
      });
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
        handleError(error, {
          defaultMessage: 'Failed to resend invitation',
          context: { action: 'resendOrganizationInvitation', invitation_id },
          showToast: true,
        });
        return false;
      }

      return data as OrganizationInvitation;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to resend invitation',
        context: { action: 'resendOrganizationInvitation', invitation_id },
        showToast: true,
      });
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
        handleError(error, {
          defaultMessage: 'Failed to revoke invitation',
          context: { action: 'revokeOrganizationInvitation', invitation_id },
          showToast: true,
        });
        return false;
      }

      return data as OrganizationInvitation;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to revoke invitation',
        context: { action: 'revokeOrganizationInvitation', invitation_id },
        showToast: true,
      });
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
        handleError(inviteError, {
          defaultMessage: "Can't find invitation",
          context: { action: 'acceptOrganizationInvitation', token },
          showToast: true,
        });
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
        handleError(memberError, {
          defaultMessage: 'Failed to add user as organization member',
          context: {
            action: 'acceptOrganizationInvitation',
            token,
            profile_id,
          },
          showToast: true,
        });
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
        handleError(updateError, {
          defaultMessage: 'Failed to update status of invitation',
          context: {
            action: 'acceptOrganizationInvitation',
            token,
            profile_id,
          },
          showToast: true,
        });
        return false;
      }

      return true;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to accept invitation',
        context: { action: 'acceptOrganizationInvitation', token, profile_id },
        showToast: true,
      });
      return false;
    }
  });
};
