import { redirect } from 'next/navigation';
import { CreateOrganization } from '@/components/create-organization';
import { createServerSupabaseClient, getSession } from '@/lib/supabase/server';

export default async function CreateOrganizationPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  const supabase = await createServerSupabaseClient();

  // Check if user already has organizations
  const { data: organizations } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', session.user.id);

  if (organizations?.length) {
    redirect('/organization');
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <CreateOrganization />
      </div>
    </div>
  );
}
