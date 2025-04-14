import type { UserProfile } from '@/types';
import { apiClient } from './client';

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await apiClient.get('/user/profile');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};
