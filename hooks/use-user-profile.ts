import { useCallback } from 'react';
import { useAppStore } from '@/contexts/app-store';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/lib/api/user';

export const useUserProfile = () => {
  const { userProfile, setUserProfile } = useAppStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const data = await getUserProfile();
        setUserProfile(data);
        return data;
      } catch (error) {
        throw new Error('Failed to fetch user profile');
      }
    },
    initialData: userProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    userProfile: data || null,
    isLoading,
    error,
    refresh,
  };
};
