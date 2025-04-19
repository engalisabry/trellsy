'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Organization, OrganizationSwitcherProps } from '@/types';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CreateOrganization } from '@/components/create-organization';
import {
  Dialog,
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
} from '@/components/ui/select';
import { useOrganizationStore } from '@/lib/stores';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function OrganizationSwitcher({
  appearance,
}: OrganizationSwitcherProps) {
  const router = useRouter();

  const { fetchOrganizations, organizations } = useOrganizationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null);
  const [localLoading, setLocalLoading] = useState(true);

  const orgs = useMemo(
    () => (Array.isArray(organizations) ? organizations : []),
    [organizations],
  );

  console.log(organizations);

  // Fetch organizations on mount
  useEffect(() => {
    setLocalLoading(true);

    fetchOrganizations()
      .then(() => {})
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Error fetching organizations',
        );
      })
      .finally(() => {
        setLocalLoading(false);
      });
  }, [fetchOrganizations]);

  // Set the first organization as active by default
  useEffect(() => {
    if (orgs.length > 0) {
      if (
        !activeOrganization ||
        !orgs.find((org) => org.id === activeOrganization.id)
      ) {
        setActiveOrganization(orgs[0]);
      }
    }
  }, [orgs, activeOrganization]);

  const handleOrganizationChange = async (orgId: string) => {
    if (orgId === 'create') {
      setIsModalOpen(true);
      return;
    }

    if (orgId === 'leave') {
      // Handle leave organization logic
      toast.info('Leave organization feature coming soon');
      return;
    }

    const selectedOrg = orgs.find((org) => org.id === orgId);
    if (selectedOrg) {
      setActiveOrganization(selectedOrg);
      router.push(`/organization/${selectedOrg.id}`);
    }
  };

  const renderTriggerContent = () => {
    // Use local loading state instead of the global one
    if (localLoading) {
      return (
        <div className='flex items-center gap-2'>
          <Loader2 className='h-4 w-4 animate-spin' />
          <span>Loading organizations...</span>
        </div>
      );
    }

    if (orgs.length === 0) {
      return <span>No organizations</span>;
    }

    if (!activeOrganization && orgs.length > 0) {
      const firstOrg = orgs[0];
      return (
        <div className='flex w-full items-center gap-2'>
          <Avatar className='h-5 w-5'>
            <AvatarImage
              src={firstOrg.logo_url as string}
              alt={firstOrg.name || 'Organization'}
            />
            <AvatarFallback className='text-xs'>
              {firstOrg.name ? firstOrg.name.charAt(0).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          <span className='truncate'>{firstOrg.name ?? 'Organization'}</span>
        </div>
      );
    }

    return (
      <div className='flex w-full items-center gap-2'>
        <Avatar className='h-5 w-5'>
          <AvatarImage
            src={activeOrganization?.logo_url as string}
            alt={activeOrganization?.name || 'Organization'}
          />
          <AvatarFallback className='text-xs'>
            {activeOrganization?.name
              ? activeOrganization.name.charAt(0).toUpperCase()
              : '?'}
          </AvatarFallback>
        </Avatar>
        <span className='truncate'>
          {activeOrganization?.name ?? 'Organization'}
        </span>
      </div>
    );
  };

  return (
    <>
      <div style={appearance?.elements?.rootBox}>
        <Select
          value={activeOrganization?.id || (orgs.length > 0 ? orgs[0].id : '')}
          onValueChange={handleOrganizationChange}
          disabled={localLoading}
        >
          <SelectTrigger style={appearance?.elements?.trigger}>
            {renderTriggerContent()}
          </SelectTrigger>
          <SelectContent>
            {orgs.map((organization) => (
              <SelectItem
                key={organization.id}
                value={organization.id}
                style={appearance?.elements?.item}
              >
                <div className='flex items-center gap-2'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage
                      src={organization.logo_url as string}
                      alt={organization.name || 'Organization logo'}
                    />
                    <AvatarFallback>
                      {organization.name
                        ? organization.name.charAt(0).toUpperCase()
                        : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{organization.name}</span>
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
            {orgs.length > 0 && (
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

      <Dialog
        open={isModalOpen}
        onOpenChange={() => setIsModalOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Fill out the details to create a new organization.
            </DialogDescription>
          </DialogHeader>
          <CreateOrganization />
        </DialogContent>
      </Dialog>
    </>
  );
}
