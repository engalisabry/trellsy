import { redirect } from 'next/navigation';
import { CreateOrganizationForm } from '@/components/create-organization-form';
import { createServerSupabaseClient, getSession } from '@/lib/supabase/server';

export default async function CreateOrganizationPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  const supabase = await createServerSupabaseClient();

  // Check if user already has organizations
  const { data: organizations } = await supabase
    .from('OrganizationMembers')
    .select('organization_id')
    .eq('profile_id', session.user.id);

  if (organizations?.length) {
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
