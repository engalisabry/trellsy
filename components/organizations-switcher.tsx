'use client';

import { CSSProperties, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  logo?: string | null;
}

interface OrganizationSwitcherProps {
  afterCreateOrganizationUrl?: (orgId: string) => string;
  afterLeaveOrganizationUrl?: string;
  afterSelectOrganizationUrl?: (orgId: string) => string;
  appearance?: {
    elements?: {
      rootBox?: CSSProperties;
      trigger?: CSSProperties;
      item?: CSSProperties;
    };
  };
  currentOrgId?: string;
}

interface OrganizationMember {
  organizations: {
    id: string;
    name: string;
    logo_url: string | null;
  }[];
}

export function OrganizationSwitcher({
  afterCreateOrganizationUrl = (orgId) => `/organization/${orgId}`,
  afterLeaveOrganizationUrl = '/select-org',
  afterSelectOrganizationUrl = (orgId) => `/organization/${orgId}`,
  appearance,
  currentOrgId,
}: OrganizationSwitcherProps) {
  const supabase = createClient();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const handleOrganizationAction = (orgId: string) => {
    if (orgId === 'create') {
      router.push(`${afterCreateOrganizationUrl}`);
    } else if (orgId === 'leave') {
      router.push(afterLeaveOrganizationUrl);
    } else {
      router.push(afterSelectOrganizationUrl(orgId));
    }
  };

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

      // In your fetch function:
      if (!error && data) {
        const orgs = (data as OrganizationMember[]).flatMap(
          ({ organizations }) =>
            organizations.map((org) => ({
              id: org.id,
              name: org.name,
              logo: org.logo_url,
            })),
        );
        setOrganizations(orgs);
      }
      setLoading(false);
    };

    fetchOrganizations();
  }, []);

  if (loading) return <div>Loading organizations...</div>;

  return (
    <div style={appearance?.elements?.rootBox}>
      <Select
        value={currentOrgId}
        onValueChange={handleOrganizationAction}
      >
        <SelectTrigger style={appearance?.elements?.trigger}>
          <SelectValue placeholder='Select organization' />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem
              key={org.id}
              value={org.id}
              style={appearance?.elements?.item}
            >
              <div className='flex items-center gap-2'>
                {org.logo ? (
                  <img
                    src={org.logo}
                    alt={org.name}
                    className='h-5 w-5 rounded-full object-cover'
                  />
                ) : (
                  <span className='flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium'>
                    {org.name.charAt(0)}
                  </span>
                )}
                {org.name}
              </div>
            </SelectItem>
          ))}
          <SelectItem
            value='create'
            style={appearance?.elements?.item}
          >
            <div className='flex items-center gap-2'>
              <Plus className='h-4 w-4' />
              Create Organization
            </div>
          </SelectItem>
          {organizations.length > 0 && (
            <SelectItem
              value='leave'
              style={appearance?.elements?.item}
            >
              Leave Organization
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
