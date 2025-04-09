// app/organization/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

// app/organization/[id]/page.tsx

type OrgType = {
  id: string;
  name: string;
  logo_url: string | null;
};

export default function OrganizationPage() {
  const supabase = createClient();
  const [organization, setOrganization] = useState<OrgType | null>(null);
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrganization = async () => {
      const orgId = params.id as string;
      if (!orgId) return;

      try {
        setLoading(true);

        // Verify auth
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return toast.error('Authentication required');
        }

        // Fetch org data
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, logo_url')
          .eq('id', orgId)
          .single();

        if (error) throw error;

        if (data) {
          setOrganization(data);
        } else {
          toast.error('Organization not found');
          router.push('/organization');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [params.id, router, supabase]);

  if (loading) return <div>Loading...</div>;
  if (!organization) return <div>Not available</div>;

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
