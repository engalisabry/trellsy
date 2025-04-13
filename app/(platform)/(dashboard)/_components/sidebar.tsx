'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import { CreateOrganization } from '@/components/create-organization';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizationList } from '@/hooks/use-organization-list';
import { NavItem } from './nav-item';

interface SidebarProps {
  StorageKey?: string;
}

export const Sidebar = ({ StorageKey = 't-sidebar-state' }: SidebarProps) => {
  const [expanded, setExpanded] = useLocalStorage<Record<string, any>>(
    StorageKey,
    {},
  );

  console.log(expanded);

  const { isLoading, organizations, userMembership, activeOrganization } =
    useOrganizationList();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const defaultAccordionValue: string[] = Object.keys(expanded).reduce(
    (acc: string[], key: string) => {
      if (expanded[key]) {
        acc.push(key);
      }

      return acc;
    },
    [],
  );

  const onExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (isLoading) {
    return <Skeleton className='w-full' />;
  }

  return (
    <>
      <div className='mb-1 flex items-center text-xs font-medium'>
        <span className='pl-4'>Workspaces</span>
        <Button
          className='ml-auto'
          size='icon'
          variant='ghost'
          type='button'
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className='h-4 w-4' />
        </Button>
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
      </div>

      <Accordion
        type='multiple'
        defaultValue={defaultAccordionValue}
      >
        {userMembership.map((membership) => (
          <NavItem
            key={membership.id}
            isActive={activeOrganization?.id === membership.organization.id}
            isExpanded={expanded[membership.organization.id]}
            organization={membership.organization}
            onExpand={onExpand}
          />
        ))}
      </Accordion>
    </>
  );
};
