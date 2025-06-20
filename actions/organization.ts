'use server';

import { revalidatePath } from 'next/cache';
import { organizationCreateSchema } from '@/types';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/utils/db';

export async function createOrganizationAction(formData: FormData) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate input
    const { name, slug } = organizationCreateSchema.parse({
      name: formData.get('name'),
      slug: formData.get('slug'),
    });

    // Check if slug is available
    const existingOrg = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingOrg) {
      return { success: false, error: 'Slug is already taken' };
    }

    // Create organization
    const organization = await db.organization.create({
      data: {
        name,
        slug,
        created_by: user.id,
      },
    });

    // Revalidate relevant paths
    revalidatePath('/organization');
    revalidatePath('/create-organization');

    return { success: true, organization };
  } catch (error: any) {
    console.error('Create organization error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create organization',
    };
  }
}

export async function checkSlugAvailabilityAction(slug: string) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!slug || slug.length < 3) {
      return { success: false, error: 'Slug must be at least 3 characters' };
    }

    const existingOrg = await db.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    return { success: true, available: !existingOrg };
  } catch (error: any) {
    console.error('Check slug availability error:', error);
    return {
      success: false,
      error: 'Failed to check slug availability',
    };
  }
}

export async function fetchUserOrganizationsAction() {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Get organizations created by user and memberships
    const [createdOrgs, memberships] = await Promise.all([
      db.organization.findMany({
        where: { created_by: user.id },
        orderBy: { created_at: 'desc' },
      }),
      db.organizationMembers.findMany({
        where: { profile_id: user.id },
        include: {
          organization: true,
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    // Combine organizations from both sources, avoiding duplicates
    const memberOrgs = memberships.map((m) => m.organization);
    const allOrgs = [...createdOrgs];

    // Add member organizations that aren't already in the created list
    memberOrgs.forEach((org) => {
      if (!allOrgs.find((existing) => existing.id === org.id)) {
        allOrgs.push(org);
      }
    });

    return {
      success: true,
      organizations: allOrgs,
      memberships: memberships.map((m) => ({
        id: m.id,
        organization_id: m.organization_id,
        role: m.role,
        user_id: m.profile_id,
        created_at: m.created_at?.toISOString(),
        avatar_url: m.avatar_url,
      })),
    };
  } catch (error: any) {
    console.error('Fetch organizations error:', error);
    return {
      success: false,
      error: 'Failed to fetch organizations',
    };
  }
}
