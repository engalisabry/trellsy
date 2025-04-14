'use client';

import { createContext, useContext } from 'react';
import type { Organization, UserProfile } from '@/types';
import { useOrganizations } from '@/hooks/use-organizations';
import { useUserProfile } from '@/hooks/use-user-profile';

interface AppContextType {
  organizations: Organization[];
  userProfile: UserProfile | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  clearCache: () => void;
}

const AppContext = createContext<AppContextType>({
  organizations: [],
  userProfile: null,
  isLoading: false,
  refreshData: async () => {},
  clearCache: () => {},
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    organizations,
    isLoading: orgsLoading,
    error: orgsError,
    refresh: refreshOrgs,
  } = useOrganizations();

  const {
    userProfile,
    isLoading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useUserProfile();

  const refreshData = async () => {
    await Promise.all([refreshOrgs(), refreshProfile()]);
  };

  const clearCache = () => {
    // Clear cache implementation
  };

  return (
    <AppContext.Provider
      value={{
        organizations,
        userProfile,
        isLoading: orgsLoading || profileLoading,
        refreshData,
        clearCache,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
