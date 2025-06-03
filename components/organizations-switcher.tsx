'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrganizationSwitcherProps } from '@/types';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CreateOrganizationForm } from '@/components/create-organization-form';
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

  const {
    fetchOrganizations,
    organizations,
    currentOrganization,
    setCurrentOrganization,
  } = useOrganizationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  const orgs = useMemo(
    () => (Array.isArray(organizations) ? organizations : []),
    [organizations],
  );

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

  const handleOrganizationChange = async (orgId: string) => {
    if (orgId === 'create') {
      setIsModalOpen(true);
      return;
    }

    if (orgId === 'leave') {
      toast.info('Leave organization feature coming soon');
      return;
    }

    setCurrentOrganization(orgId);
    router.push(`/organization/${orgId}`);
  };

  const renderTriggerContent = () => {
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

    const activeOrg = currentOrganization || (orgs.length > 0 ? orgs[0] : null);

    if (!activeOrg) {
      return null;
    }

    return (
      <div className='flex w-full items-center gap-2'>
        <Avatar className='h-5 w-5'>
          <AvatarImage
            src={activeOrg.logo_url as string}
            alt={activeOrg.name || 'Organization'}
          />
          <AvatarFallback className='text-xs'>
            {activeOrg.name ? activeOrg.name.charAt(0).toUpperCase() : '?'}
          </AvatarFallback>
        </Avatar>
        <span className='truncate'>{activeOrg.name ?? 'Organization'}</span>
      </div>
    );
  };

  return (
    <>
      <div style={appearance?.elements?.rootBox}>
        <Select
          value={
            currentOrganization?.slug || (orgs.length > 0 ? orgs[0].slug : '')
          }
          onValueChange={handleOrganizationChange}
          disabled={localLoading}
        >
          <SelectTrigger style={appearance?.elements?.trigger}>
            {renderTriggerContent()}
          </SelectTrigger>
          <SelectContent>
            {orgs.map((organization) => (
              <SelectItem
                key={organization.slug}
                value={organization.slug}
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
          <CreateOrganizationForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
