import type { UserProfile } from '@/types';
import { toast } from 'sonner';
import { getSupabaseClient, handleApiError } from './api';
import { getCurrentUser } from './auth.service';

/**
 * Fetches the current user's profile
 */
export const fetchUserProfile = async () => {
  const supabase = getSupabaseClient();

  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('No authenticated user found');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    // Add timestamps if they're missing
    const profile: UserProfile = {
      id: data.id,
      name: data.full_name,
      avatar_url: data.avatar_url,
      email: data.email,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
    };

    return profile;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch user profile');
  }
};

/**
 * Updates the user profile
 */
export const updateUserProfile = async (data: Partial<UserProfile>) => {
  const supabase = getSupabaseClient();

  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('No authenticated user found');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    toast.success('Profile updated successfully');
    return true;
  } catch (error) {
    throw handleApiError(error, 'Failed to update profile');
  }
};
