'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizationStore } from '@/lib/stores';

export default function OrganizationPage() {
  const params = useParams();
  const { organizations, isLoading, error, fetchOrganizations } =
    useOrganizationStore();

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  if (isLoading) {
    return <Skeleton className='h-full w-full' />;
  }

  if (error) {
    return toast.error(
      error instanceof Error ? error.message : 'An error occurred',
    );
  }

  // Find the current organization based on the URL parameter
  const currentOrgId = params.id as string;
  const organization = organizations.find((org) => org.id === currentOrgId);

  if (!organization) {
    return <div className='p-4'>Organization not found</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='mb-4 text-2xl font-bold'>Organization Details</h1>
      <div className='space-y-4'>
        <div>
          <p className='font-medium'>ID:</p>
          <p className='text-sm text-gray-600'>{organization.id}</p>
        </div>
        <div>
          <p className='font-medium'>Name:</p>
          <p className='text-lg'>{organization.name}</p>
        </div>
        {organization.logo_url ? (
          <Image
            src={organization.logo_url as string}
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
    </div>
  );
}
