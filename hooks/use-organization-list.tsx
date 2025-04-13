'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Organization } from '@/types';
import { toast } from 'sonner';
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
}

interface UseOrganizationListResult {
  organizations: Organization[];
  isLoading: boolean;
  isError: Error | string;
  userMembership: UserMembership[];
  activeOrganization: Organization | null;
  setActive: (params: { organization: string }) => void;
}

export function useOrganizationList(
  options?: UseOrganizationListOptions,
): UseOrganizationListResult {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrgId = searchParams?.get('organization') || '';

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMembership, setUserMembership] = useState<UserMembership[]>([]);
  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<Error | string>('');

  useEffect(() => {
    const fetchOrganizations = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error('Please login first', {
            action: {
              label: 'login',
              onClick: () => router.push(`/auth/login`),
            },
          });
        }

        const query = supabase
          .from('organization_members')
          .select(
            `
            id,
            role,
            created_at,
            organizations(id, name, logo_url)
          `,
          )
          .eq('user_id', user?.id);

        if (options?.userMembership?.infinite) {
          //  pagination logic here
        }

        const { data, error } = await query;

        if (!error && data) {
          const memberships = data.map((m) => {
            const orgArray = Array.isArray(m.organizations)
              ? m.organizations
              : [m.organizations];

            const org = orgArray[0];

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

          const orgs = memberships.map((m) => m.organization);

          setUserMembership(memberships);
          setOrganizations(orgs);

          const initialOrg =
            orgs.find((o) => o.id === initialOrgId) || orgs[0] || null;
          setActiveOrganization(initialOrg);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Something went wrong',
          {
            action: {
              label: 'login',
              onClick: () => router.push(`/auth/login`),
            },
          },
        );
        error instanceof Error
          ? setIsError(error.message)
          : setIsError('Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, [initialOrgId, supabase, options?.userMembership?.infinite]);

  const setActive = useCallback(
    ({ organization }: { organization: string }) => {
      const org = organizations.find((o) => o.id === organization);
      if (org && activeOrganization?.id !== org.id) {
        setActiveOrganization(org);
        router.push(`/organization/${org.id}`);
      }
    },
    [organizations, activeOrganization, router],
  );

  return {
    organizations,
    isLoading,
    isError,
    userMembership,
    activeOrganization,
    setActive,
  };
}
