import type { Organization } from '@/types';
import { apiClient } from './client';

export const getOrganizations = async (): Promise<Organization[]> => {
  try {
    const response = await apiClient.get('/organizations');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    throw error;
  }
};
