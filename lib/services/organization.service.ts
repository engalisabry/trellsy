import type {
  Organization,
  OrganizationCreateInput,
  OrganizationMember,
} from '@/types';
import { toast } from 'sonner';
import { getSession } from '../supabase/server';
import { getSupabaseClient, handleApiError } from './api';
import { getCurrentUser } from './auth.service';

/**
 * Fetches all organizations for the current user
 */
export const fetchUserOrganizations = async () => {
  const supabase = getSupabaseClient();

  try {
    const user = await getCurrentUser();

    if (!user) {
      toast.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }

    const { data, error } = await supabase
      .from('organization_members')
      .select(
        `
        id, organization_id, user_id, role, created_at,
        organization:organizations (
          id, name, slug, logo_url, metadata, created_at, updated_at
        )
      `,
      )
      .eq('user_id', user.id);

    if (error) {
      toast.error(error.message || 'Failed to fetch organizations');
      throw error;
    }

    // Process and flatten the data
    const organizations: Organization[] = [];
    const memberships: OrganizationMember[] = [];

    if (data && Array.isArray(data)) {
      data.forEach((m) => {
        let orgObj = null;
        if (Array.isArray(m.organization)) {
          if (m.organization.length > 0) {
            orgObj = m.organization[0];
          }
        } else if (m.organization && typeof m.organization === 'object') {
          orgObj = m.organization;
        }

        if (orgObj) {
          organizations.push({ ...orgObj });
        }

        memberships.push({
          id: m.id,
          organization_id: m.organization_id,
          user_id: m.user_id,
          role: m.role,
          created_at: m.created_at,
        });
      });
    }

    // If no organizations were found, create a dummy one for testing
    if (organizations.length === 0) {
      const dummyOrg = {
        id: 'dummy-org-id',
        name: 'Test Organization',
        slug: 'test-org',
        logo_url: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      organizations.push(dummyOrg);

      // Also create a dummy membership
      memberships.push({
        id: 'dummy-membership-id',
        organization_id: dummyOrg.id,
        user_id: user.id,
        role: 'admin',
        created_at: new Date().toISOString(),
      });
    }

    return { organizations, memberships };
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch organizations');
  }
};

/**
 * Upload Logo
 */

export const uploadOrganizationLogo = async (file: File, slug: string) => {
  const supabase = getSupabaseClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${slug}-${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage
    .from('organization-logos')
    .upload(fileName, file);

  if (error) {
    toast.error('Failed to get the organization logo');
  }

  const { data: publicUrlData } = supabase.storage
    .from('organization-logos')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

/**
 * Creates a new organization
 */
export const createOrganization = async (props: OrganizationCreateInput) => {
  const supabase = getSupabaseClient();
  const session = await getSession();

  try {
    // Insert organization
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: props.name,
        slug: props.slug,
        logo_url: props.logo_url,
        // metadata is optional, add if needed
      })
      .select()
      .single();

    if (error) throw error;

    // Insert membership for the creator as admin
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: data.id,
        user_id: session?.user.id,
        role: 'admin',
      });

    if (memberError) {
      toast.error('Failed to add user to organization');
      console.error(memberError);
      throw memberError;
    }

    return data;
  } catch (error) {
    console.error(error);
    throw handleApiError(error, 'Failed to create organization');
  }
};

/**
 * Updates an organization
 */
export const updateOrganization = async (
  id: string,
  data: Partial<Organization>,
) => {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('organizations')
      .update(data)
      .eq('id', id);

    if (error) {
      toast.error(error.message || 'Failed to update organization');
      throw error;
    }

    toast.success('Organization updated successfully');
    return true;
  } catch (error) {
    throw handleApiError(error, 'Failed to update organization');
  }
};

/**
 * Deletes an organization
 */
export const deleteOrganization = async (id: string) => {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(error.message || 'Failed to delete organization');
      throw error;
    }

    toast.success('Organization deleted successfully');
    return true;
  } catch (error) {
    throw handleApiError(error, 'Failed to delete organization');
  }
};
