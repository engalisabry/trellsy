'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function OrganizationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    logo_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    setOrgId(params.id); // Store the param in state
  }, [params.id]);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgId) return; // Wait until we have the orgId

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        // Get organization data
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, logo_url')
          .eq('id', orgId) // Use the stored orgId
          .single();

        if (error) throw error;
        setOrganization(data);
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [orgId]); // Depend on orgId instead of params.id

  if (loading) return <div>Loading...</div>;
  if (!organization) return <div>Organization not found</div>;

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
        {organization.logo_url && (
          <div>
            <p className='font-medium'>Logo:</p>
            <img
              src={organization.logo_url}
              alt={`${organization.name} logo`}
              className='h-32 w-32 object-contain'
            />
          </div>
        )}
      </div>
    </div>
  );
}
