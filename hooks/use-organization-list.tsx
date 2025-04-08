'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  logo?: string | null;
}

interface UseOrganizationListResult {
  organizations: Organization[];
  activeOrganization: Organization | null;
  setActive: (params: { organization: string }) => void;
}

export function useOrganizationList(): UseOrganizationListResult {
  const supabase = createClient();
  const router = useRouter();
  // Optionally, if you want to read an organization id from the URL on mount.
  const searchParams = useSearchParams();
  const initialOrgId = searchParams?.get('organization') || '';

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null);

  // Fetch organizations from supabase
  useEffect(() => {
    const fetchOrganizations = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('organization_members')
        .select('organizations(id, name, logo_url)')
        .eq('user_id', user.id);

      if (!error && data) {
        // Handle scenario where each row's organizations field might be an object or an array.
        const orgs = data
          .map((row: any) => {
            const orgArray = Array.isArray(row.organizations)
              ? row.organizations
              : [row.organizations];
            return orgArray.map((org: any) => ({
              id: org.id,
              name: org.name,
              logo: org.logo_url,
            }));
          })
          .flat()
          .filter(Boolean);

        setOrganizations(orgs);

        // If there is an org id in URL, try to match it.
        if (initialOrgId) {
          const found = orgs.find((o) => o.id === initialOrgId);
          if (found) {
            setActiveOrganization(found);
          } else if (orgs.length) {
            // fallback to the first org if the provided org isn't found.
            setActiveOrganization(orgs[0]);
          }
        } else if (orgs.length) {
          // If there's no URL param then use the first found organization.
          setActiveOrganization(orgs[0]);
        }
      }
    };

    fetchOrganizations();
  }, [initialOrgId, supabase]);
  const setActive = ({ organization }: { organization: string }) => {
    const org = organizations.find((o) => o.id === organization);
    if (org) {
      setActiveOrganization(org);

      router.push(`/organization/${org.id}`);
    }
  };

  return { organizations, activeOrganization, setActive };
}
