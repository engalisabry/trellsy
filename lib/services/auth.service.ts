/**
 * Simplified auth service - only user sync utilities
 * All auth actions moved to /lib/auth/actions.ts
 */
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/utils/db';

// Re-export auth actions for backward compatibility
export { signupWithEmailPassword, resendVerificationEmail } from '@/lib/auth/actions';

/**
 * Get current server user - used in middleware
 */
export const getCurrentServerUser = async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
};

/**
 * Legacy sync function for backward compatibility
 * New code should use syncUserToPrisma from /lib/auth/sync.ts
 */
export const syncUserProfile = async (
  userId: string,
  userData: {
    email?: string;
    full_name?: string;
    avatar_url?: string;
  },
) => {
  try {
    const existingProfile = await db.profile.findUnique({
      where: { id: userId },
    });

    if (existingProfile) {
      return await db.profile.update({
        where: { id: userId },
        data: {
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          updated_at: new Date(),
        },
      });
    } else {
      return await db.profile.create({
        data: {
          id: userId,
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
        },
      });
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Check if user has organizations - used in callback route
 */
export const userHasOrganizations = async (userId: string) => {
  try {
    const membershipCount = await db.organizationMembers.count({
      where: { profile_id: userId },
    });

    const createdOrgsCount = await db.organization.count({
      where: { created_by: userId },
    });

    return membershipCount > 0 || createdOrgsCount > 0;
  } catch (error) {
    return false;
  }
};
