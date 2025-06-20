import type { UserProfile } from '@/types';
import { toast } from 'sonner';
import { withAuth } from '@/lib/auth/middleware';
import { handleError } from '@/lib/utils/error-handling';
import { db } from '@/lib/utils/db';

/**
 * Fetches the current user's profile
 */
export const fetchUserProfile = async () => {
  return withAuth(async (userId) => {
    try {
      if (!userId) {
        handleError('auth', {
          defaultMessage: 'No authenticated user found',
          showToast: true,
        });
        return false;
      }

      // Using Prisma instead of Supabase
      const profile = await db.profile.findUnique({
        where: { id: userId },
        select: {
          id: true,
          full_name: true,
          avatar_url: true,
          email: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!profile) {
        // Profile doesn't exist, create one for the user
        const newProfile = await db.profile.create({
          data: {
            id: userId,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        return {
          id: newProfile.id,
          full_name: newProfile.full_name,
          avatar_url: newProfile.avatar_url,
          email: newProfile.email,
          created_at:
            newProfile.created_at?.toISOString() || new Date().toISOString(),
          updated_at:
            newProfile.updated_at?.toISOString() || new Date().toISOString(),
        } as UserProfile;
      }

      // Return the formatted profile
      const userProfile: UserProfile = {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        email: profile.email,
        created_at:
          profile.created_at?.toISOString() || new Date().toISOString(),
        updated_at:
          profile.updated_at?.toISOString() || new Date().toISOString(),
      };

      return userProfile;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to fetch user profile',
        showToast: true,
        context: { action: 'fetchUserProfile' },
      });
      return false;
    }
  });
};

/**
 * Updates the user profile
 */
export const updateUserProfile = async (data: Partial<UserProfile>) => {
  return withAuth(async (userId) => {
    try {
      if (!userId) {
        throw new Error('No authenticated user found');
      }

      // Using Prisma instead of Supabase
      await db.profile.update({
        where: { id: userId },
        data: {
          full_name: data.full_name || null,
          avatar_url: data.avatar_url || null,
          email: data.email || null,
          updated_at: new Date(),
        },
      });

      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      handleError(error, {
        defaultMessage: 'Failed to update profile',
        showToast: true,
        context: { action: 'updateUserProfile' },
      });
      return false;
    }
  });
};
