'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Organization, UserProfile } from '@/types';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { decryptData, encryptData } from '@/lib/encryption';
import { createClient } from '@/lib/supabase/client';

interface UserMembership {
  id: string;
  role: string;
  created_at: string;
  organization: Organization;
}

interface UseOrganizationListOptions {
  userMembership?: {
    infinite?: boolean;
  };
  skipCache?: boolean;
}

interface UseOrganizationListResult {
  user: User | null;
  userProfile: UserProfile | null;
  organizations: Organization[];
  isLoading: boolean;
  isError: string;
  userMembership: UserMembership[];
  activeOrganization: Organization | null;
  setActive: (params: { organization: string }) => void;
}

const CACHE_KEY = 'org_data_cache';

export function useOrganizationList(
  options?: UseOrganizationListOptions,
): UseOrganizationListResult {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrgId = searchParams?.get('organization') || '';

  const [state, setState] = useState<
    Omit<UseOrganizationListResult, 'setActive'>
  >({
    user: null,
    userProfile: null,
    organizations: [],
    isLoading: true,
    isError: '',
    userMembership: [],
    activeOrganization: null,
  });

  const [{ setIsError, setIsLoading }] = useState({
    setIsLoading: (loading: boolean) =>
      setState((prev) => ({ ...prev, isLoading: loading })),
    setIsError: (error: string) =>
      setState((prev) => ({ ...prev, isError: error })),
  });

  const loadFromCache = useCallback(() => {
    try {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        return decryptData<Omit<UseOrganizationListResult, 'setActive'>>(
          cachedData,
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load cached data',
      );
      sessionStorage.removeItem(CACHE_KEY);
    }
    return null;
  }, []);

  const saveToCache = useCallback(
    (data: Omit<UseOrganizationListResult, 'setActive'>) => {
      try {
        sessionStorage.setItem(CACHE_KEY, encryptData(data));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to save data to cache',
        );
      }
    },
    [],
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError('');

    try {
      // Get user session
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Fetch all data in parallel
      const [
        { data: membershipsData, error: membershipsError },
        { data: profileData, error: profileError },
      ] = await Promise.all([
        supabase
          .from('organization_members')
          .select(
            `
            id,
            role,
            created_at,
            organizations(id, name, logo_url)
          `,
          )
          .eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ]);

      if (membershipsError || profileError) {
        throw membershipsError || profileError;
      }

      // Process memberships
      const memberships = (membershipsData || []).map((m) => {
        const orgData = m.organizations;
        const org = Array.isArray(orgData) ? orgData[0] : orgData;

        return {
          id: m.id,
          role: m.role,
          created_at: m.created_at,
          organization: {
            id: org.id,
            name: org.name,
            logo: org.logo_url || null,
          },
        };
      });

      const organizations = memberships.map((m) => m.organization);
      const activeOrg =
        organizations.find((o) => o.id === initialOrgId) ||
        organizations[0] ||
        null;

      const newState = {
        user,
        userProfile: profileData || null,
        organizations,
        isLoading: false,
        isError: '',
        userMembership: memberships,
        activeOrganization: activeOrg,
      };

      setState(newState);
      saveToCache(newState);

      return newState;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load data';
      toast.error(errorMessage, {
        action:
          error instanceof Error && error.message === 'Authentication required'
            ? {
                label: 'Login',
                onClick: () => router.push('/auth/login'),
              }
            : undefined,
      });

      const newState = {
        ...state,
        isLoading: false,
        isError: errorMessage,
      };

      setState(newState);
      return newState;
    } finally {
      setIsLoading(false);
    }
  }, [initialOrgId, supabase, router]);

  useEffect(() => {
    const initialize = async () => {
      if (options?.skipCache) {
        await fetchData();
        return;
      }

      const cachedData = loadFromCache();
      if (cachedData) {
        setState({
          ...cachedData,
          isLoading: false,
        });
      }

      // Always fetch fresh data in background
      try {
        const freshData = await fetchData();

        // Only update if different from cache
        if (
          cachedData &&
          JSON.stringify(cachedData) !== JSON.stringify(freshData)
        ) {
          setState({
            ...freshData,
            isLoading: false,
          });
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Background refresh failed',
        );
      }
    };

    initialize();
  }, [options?.skipCache]);

  const setActive = useCallback(
    ({ organization }: { organization: string }) => {
      const org = state.organizations.find((o) => o.id === organization);
      if (org && state.activeOrganization?.id !== org.id) {
        const newState = {
          ...state,
          activeOrganization: org,
        };

        setState(newState);
        saveToCache(newState);
        router.push(`/organization/${org.id}`);
      }
    },
    [state, router],
  );

  return {
    ...state,
    setActive,
  };
}
