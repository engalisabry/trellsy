import { redirect } from 'next/navigation';
import { CreateOrganization } from '@/components/create-organization';
import { createClient } from '@/lib/supabase/server';

export default async function CreateOrganizationPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect('/login');

  // Check if user already has organizations
  const { data: organizations } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id);

  if (organizations?.length) {
    redirect('/dashboard');
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <CreateOrganization />;
      </div>
    </div>
  );
}
