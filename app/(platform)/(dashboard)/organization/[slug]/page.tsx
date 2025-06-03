'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { create } from '@/actions/create-board';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const currentOrgSlug = params.slug;
  const organization = organizations.find((org) => org.slug === currentOrgSlug);

  if (!organization) {
    return <div className='p-4'>Organization not found</div>;
  }

  // Handler to wrap the create action and handle result
  const handleCreateBoard = async (formData: FormData) => {
    const result = await create(formData);
    if (result && result.success) {
      toast.success('Board created successfully!');
    } else {
      toast.error('Failed to create board');
    }
  };

  return (
    <div className='p-4'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          handleCreateBoard(formData);
        }}
      >
        <Input
          id='title'
          name='title'
          placeholder='Enter Board Name'
          className=''
          required
        />
        <Input
          id='organizationId'
          name='organizationId'
          type='hidden'
          value={organization.id}
        />
        <Button
          type='submit'
          size='sm'
        >
          Create
        </Button>
      </form>
      {/* <h1 className='mb-4 text-2xl font-bold'>Organization Details</h1>
      <div className='space-y-4'>
        <div>
          <p className='font-medium'>Slug</p>
          <p className='text-sm text-gray-600'>{organization.slug}</p>
        </div>
        <div>
          <p className='font-medium'>Name:</p>
          <p className='text-lg'>{organization.name}</p>
        </div>
        {organization.logo_url && (
          <Image
            src={organization.logo_url as string}
            alt={`organization ${organization.name} logo`}
            width={128}
            height={128}
            className='h-32 w-32 rounded-md object-contain'
            priority
          />
        )}
        <OrganizationProfile />
      </div> */}
    </div>
  );
}
