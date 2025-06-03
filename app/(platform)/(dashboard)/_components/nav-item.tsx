'use Client';

import { usePathname, useRouter } from 'next/navigation';
import type { Organization } from '@/types';
import { NavItemProps } from '@/types';
import { Activity, CreditCard, Layout, Settings } from 'lucide-react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const NavItem = ({
  isActive,
  isExpanded,
  onExpand,
  organization,
}: NavItemProps) => {
  const { id, name, logo_url, slug } = organization;
  const pathname = usePathname();
  const router = useRouter();

  const routes = [
    {
      label: 'Boards',
      icon: <Layout className='mr-2 h-4 w-4' />,
      href: `/organization/${slug}`,
    },
    {
      label: 'Activity',
      icon: <Activity className='mr-2 h-4 w-4' />,
      href: `/organization/${slug}/activity`,
    },
    {
      label: 'Settings',
      icon: <Settings className='mr-2 h-4 w-4' />,
      href: `/organization/${slug}/settings`,
    },
    {
      label: 'Billing',
      icon: <CreditCard className='mr-2 h-4 w-4' />,
      href: `/organization/${slug}/billing`,
    },
  ];

  const onClick = (href: string) => {
    router.push(href);
  };

  return (
    <AccordionItem
      value={organization.slug}
      className='border-none'
    >
      <AccordionTrigger
        className={cn(
          'hover:bg-netural-500/10 mb-2 flex items-center gap-x-2 rounded-md p-1.5 text-start text-neutral-700 transition hover:no-underline',
          isActive && !isExpanded && 'bg-sky-500/10 text-sky-700',
        )}
        onClick={() => onExpand(slug)}
      >
        <div className='flex items-center gap-x-2'>
          <div className='relative h-7 w-7'>
            <Avatar className='h-8 w-8'>
              <AvatarImage
                src={`${logo_url}`}
                alt={name || 'organization logo'}
              />
              <AvatarFallback>{name && name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <span className='ml-1 font-medium dark:text-[var(--primary)]'>
            {name}
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContent className='pt-1'>
        {routes.map((route) => (
          <Button
            key={route.href}
            size='sm'
            className={cn(
              'mb-1 w-full justify-start pl-10 font-normal',
              pathname === route.href && 'bg-neutral-500/10 text-sky-700',
            )}
            onClick={() => onClick(route.href)}
            variant='ghost'
          >
            {route.icon}
            {route.label}
          </Button>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
};

NavItem.Skeleton = function SkeletonNavItem() {
  return (
    <div className='flex items-center gap-x-2'>
      <div className='relative h-10 w-10 shrink-0'>
        <Skeleton className='absolute h-full w-full' />
      </div>
      <Skeleton className='h-10 w-full' />
    </div>
  );
};
