'use client';

import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CreateOrganization } from '@/components/create-organization';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  appearance?: {
    elements?: {
      rootBox?: CSSProperties;
      trigger?: CSSProperties;
      item?: CSSProperties;
    };
  };
}

export function OrganizationSwitcher({
  appearance,
}: OrganizationSwitcherProps) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch organizations with error handling
  const fetchOrganizations = useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('organization_members')
        .select('organizations(id, name, logo_url)')
        .eq('user_id', user.id);

      if (error) throw error;

      return data.flatMap((row: any) => {
        const orgData = row.organizations;
        const orgsArray = Array.isArray(orgData) ? orgData : [orgData];
        return orgsArray
          .filter((org: any) => org?.id)
          .map((org: any) => ({
            id: org.id,
            name: org.name,
            logo: org.logo_url,
          }));
      });
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
      return [];
    }
  }, [supabase]);

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      const orgs = await fetchOrganizations();
      setOrganizations(orgs);

      // Set selected organization from URL params
      if (params.id) {
        setSelectedOrgId(params.id as string);
      } else if (orgs.length > 0) {
        setSelectedOrgId(orgs[0].id);
      }

      setLoading(false);
    };

    initialize();
  }, [fetchOrganizations, params.id]);

  // Handle organization change
  const handleOrganizationChange = useCallback(
    (orgId: string) => {
      if (orgId === 'create') {
        setIsModalOpen(true);
        return;
      }

      if (orgId === 'leave') {
        router.push('/organization/leave');
        return;
      }

      // Only navigate if the organization is different
      if (orgId !== params.id) {
        router.push(`/organization/${orgId}`);
      }
    },
    [router, params.id],
  );

  return (
    <>
      <div style={appearance?.elements?.rootBox}>
        <Select
          value={selectedOrgId}
          onValueChange={(val) => {
            setSelectedOrgId(val);
            handleOrganizationChange(val);
          }}
          disabled={loading || !organizations.length}
        >
          <SelectTrigger style={appearance?.elements?.trigger}>
            {loading ? (
              <div className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>Loading organizations...</span>
              </div>
            ) : (
              <SelectValue
                placeholder={
                  organizations.length
                    ? 'Select organization'
                    : 'No organizations'
                }
              />
            )}
          </SelectTrigger>
          {organizations.length > 0 && (
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
              <SelectItem
                value='leave'
                style={appearance?.elements?.item}
              >
                Leave Organization
              </SelectItem>
            </SelectContent>
          )}
        </Select>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Fill out the details to create a new organization.
            </DialogDescription>
          </DialogHeader>
          <CreateOrganization />
          <DialogClose onClick={() => setIsModalOpen(false)}>Close</DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
