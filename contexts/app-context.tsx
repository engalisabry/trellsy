'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Organization, UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface AppContextType {
  organizations: Organization[];
  userProfile: UserProfile | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  organizations: [],
  userProfile: null,
  isLoading: true,
  refreshData: async () => {},
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch organizations
      const { data: orgData } = await supabase
        .from('organization_members')
        .select('organizations(id, name, logo_url)')
        .eq('user_id', user.id);

      const orgs =
        orgData?.flatMap((m) =>
          Array.isArray(m.organizations) ? m.organizations : [m.organizations],
        ) || [];

      setOrganizations(orgs);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profileData);

      // Store in localStorage
      localStorage.setItem('organizations', JSON.stringify(orgs));
      localStorage.setItem('userProfile', JSON.stringify(profileData));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  useEffect(() => {
    // Check localStorage first
    const cachedOrgs = localStorage.getItem('organizations');
    const cachedProfile = localStorage.getItem('userProfile');

    if (cachedOrgs && cachedProfile) {
      setOrganizations(JSON.parse(cachedOrgs));
      setUserProfile(JSON.parse(cachedProfile));
      setIsLoading(false);
    }

    // Fetch fresh data in background
    fetchData();
  }, []);

  const contextValue = useMemo(
    () => ({
      organizations,
      userProfile,
      isLoading,
      refreshData,
    }),
    [organizations, userProfile, isLoading],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
