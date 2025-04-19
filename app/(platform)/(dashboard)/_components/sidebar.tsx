'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Organization, SidebarProps } from '@/types';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizationStore } from '@/lib/stores';
import { NavItem } from './nav-item';

export const Sidebar = ({ StorageKey = 't-sidebar-state' }: SidebarProps) => {
  const [expanded, setExpanded] = useLocalStorage<Record<string, boolean>>(
    StorageKey,
    {},
  );

  const { organizations, memberships, isLoading, fetchOrganizations } =
    useOrganizationStore();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const orgs = useMemo(
    () => (Array.isArray(organizations) ? organizations : []),
    [organizations],
  );

  const mems = useMemo(
    () => (Array.isArray(memberships) ? memberships : []),
    [memberships],
  );

  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(orgs.length > 0 ? orgs[0] : null);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    if (orgs.length > 0 && !activeOrganization) {
      setActiveOrganization(orgs[0]);
    }
  }, [orgs, activeOrganization]);

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
        <span className='pl-4 font-bold'>Workspaces</span>
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
        {orgs.map((org) => {
          const membership = mems.find((m) => m.organization_id === org.id);
          const { id, name, slug, logo_url } = org;

          if (!membership) return null;

          return (
            <NavItem
              key={membership.id}
              isActive={activeOrganization?.id === org.id}
              isExpanded={expanded[org.id]}
              organization={{
                id,
                name,
                slug,
                logo_url,
              }}
              onExpand={onExpand}
            />
          );
        })}
      </Accordion>
    </>
  );
};
