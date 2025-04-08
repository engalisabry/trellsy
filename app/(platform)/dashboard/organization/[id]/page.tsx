'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

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
  const [orgId, setOrgId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setOrgId(params.id as string);
  }, [orgId]);

  useEffect(() => {
    // 1. Modified the fetchOrganization function:
    const fetchOrganization = async () => {
      if (!orgId) return;

      try {
        setLoading(true);

        // Verify auth
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/sign-in');
          return toast.error('Authentication required');
        }

        // Fetch org data (changed to single row query)
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, logo_url')
          .eq('id', orgId)
          .single(); // Added .single()

        if (error) throw error;

        if (data) {
          setOrganization({
            id: data.id,
            name: data.name,
            logo_url: data.logo_url,
          });
        } else {
          toast.error('Organization not found');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
    console.log(organization);
  }, [orgId]);

  // 2. Added loading states:
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
