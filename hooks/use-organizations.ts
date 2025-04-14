import { useCallback } from 'react';
import { useAppStore } from '@/contexts/app-store';
import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '@/lib/api/organizations';

export const useOrganizations = () => {
  const { organizations, setOrganizations } = useAppStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      try {
        const data = await getOrganizations();
        setOrganizations(data);
        return data;
      } catch (error) {
        throw new Error('Failed to fetch organizations');
      }
    },
    initialData: organizations,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    organizations: data || [],
    isLoading,
    error,
    refresh,
  };
};
