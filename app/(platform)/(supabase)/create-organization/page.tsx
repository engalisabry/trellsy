import { redirect } from 'next/navigation';
import { CreateOrganizationForm } from '@/components/create-organization-form';
import { createClient } from '@/lib/supabase/server';

export default async function CreateOrganizationPage() {
  const supabase = await createClient();
  
  // Use getUser() for secure authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/auth/login');
  }

  // Check if user already has organizations (both membership and created)
  const [membershipCheck, createdOrgCheck] = await Promise.all([
    supabase
      .from('OrganizationMembers')
      .select('organization_id')
      .eq('profile_id', user.id)
      .limit(1),
    supabase
      .from('Organization')
      .select('id')
      .eq('created_by', user.id)
      .limit(1)
  ]);

  const hasOrganizations = 
    (membershipCheck.data && membershipCheck.data.length > 0) ||
    (createdOrgCheck.data && createdOrgCheck.data.length > 0);

  if (hasOrganizations) {
    redirect('/organization');
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <CreateOrganizationForm />
      </div>
    </div>
  );
}
