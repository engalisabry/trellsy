'use client';

import { CSSProperties, useState } from 'react';
import Image from 'next/image';
import { Loader2, Plus } from 'lucide-react';
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
} from '@/components/ui/select';
import { useOrganizationList } from '@/hooks/use-organization-list';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

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
  const { organizations, activeOrganization, setActive } =
    useOrganizationList();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const loading = organizations.length === 0 && !activeOrganization;

  const handleOrganizationChange = (orgId: string) => {
    if (orgId === 'create') {
      setIsModalOpen(true);
      return;
    }

    if (orgId === 'leave') {
      // Handle leave organization logic
      return;
    }

    setActive({ organization: orgId });
  };

  return (
    <>
      <div style={appearance?.elements?.rootBox}>
        <Select
          value={activeOrganization?.id || ''}
          onValueChange={handleOrganizationChange}
          disabled={loading}
        >
          <SelectTrigger style={appearance?.elements?.trigger}>
            {loading ? (
              <div className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>Loading organizations...</span>
              </div>
            ) : (
              <div className='flex w-full items-center gap-2'>
                {activeOrganization ? (
                  <>
                    {activeOrganization.logo ? (
                      <Image
                        src={activeOrganization.logo}
                        alt={activeOrganization.name}
                        width={20}
                        height={20}
                        className='h-5 w-5 rounded-full object-cover'
                      />
                    ) : (
                      <span className='flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium'>
                        {activeOrganization.name.charAt(0)}
                      </span>
                    )}
                    <span className='truncate'>{activeOrganization.name}</span>
                  </>
                ) : (
                  <span>No organizations</span>
                )}
              </div>
            )}
          </SelectTrigger>
          <SelectContent>
            {organizations.map((organization) => (
              <SelectItem
                key={organization.id}
                value={organization.id}
                style={appearance?.elements?.item}
              >
                <div className='flex items-center gap-2'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage
                      src={`${organization.logo}`}
                      alt={organization.name || 'organization logo'}
                    />
                    <AvatarFallback>
                      {organization.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {organization.name}
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
        </DialogContent>
      </Dialog>
    </>
  );
}
