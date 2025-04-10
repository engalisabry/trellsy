import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type OrgType = {
  id: string;
  name: string;
  logo_url: string | null;
};

export default async function OrganizationPage({
  params: maybeParams,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  // Ensure params is resolved
  const params = await Promise.resolve(maybeParams);
  const supabase = await createClient();

  let organization: OrgType | null = null;
  let errorMessage: string | null = null;

  try {
    // Verify auth with caching
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      errorMessage = 'Authentication required. Please login.';
    } else {
      // Fetch org data with caching using Next.js fetch
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/organizations?id=eq.${params.id}&select=id,name,logo_url`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          cache: 'force-cache',
        },
      );

      if (!response.ok) throw new Error('Failed to fetch organization');
      const [data] = await response.json();
      organization = data;
    }
  } catch (error) {
    console.error('Error:', error);
    errorMessage = 'Failed to load organization data';
  }

  if (errorMessage) {
    return (
      <div className='p-4'>
        <h1 className='mb-4 text-2xl font-bold'>Error</h1>
        <p className='text-red-500'>{errorMessage}</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className='p-4'>
        <h1 className='mb-4 text-2xl font-bold'>Organization Not Found</h1>
      </div>
    );
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
            src={organization.logo_url}
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
