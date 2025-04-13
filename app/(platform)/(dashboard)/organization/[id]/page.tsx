'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizationList } from '@/hooks/use-organization-list';

export default function OrganizationPage() {
  const { organizations, isLoading, isError } = useOrganizationList();

  if (isLoading) {
    return <Skeleton className='h-full w-full' />;
  }

  if (isError) {
    return toast.error(isError instanceof Error ? isError.message : isError);
  }

  return (
    <div className='p-4'>
      <h1 className='mb-4 text-2xl font-bold'>Organization Details</h1>
      {organizations.map((organization) => (
        <div
          key={organization.id}
          className='space-y-4'
        >
          <div>
            <p className='font-medium'>ID:</p>
            <p className='text-sm text-gray-600'>{organization.id}</p>
          </div>
          <div>
            <p className='font-medium'>Name:</p>
            <p className='text-lg'>{organization.name}</p>
          </div>
          {organization.logo ? (
            <Image
              src={organization.logo}
              alt={`${organization.name} logo`}
              width={128}
              height={128}
              className='h-32 w-32 rounded-md object-contain'
              priority
            />
          ) : (
            <div className='flex h-32 w-32 items-center justify-center rounded-md bg-gray-200'>
              <span className='text-4xl font-bold text-gray-500'>
                {organization.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
