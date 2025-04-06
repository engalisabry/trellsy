// app/protected/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect('/login');

  // Check if user has organizations
  const { data: organizations } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id);

  if (!organizations?.length) {
    redirect('/create-organization');
  }

  // User has organizations - redirect to dashboard
  redirect('/dashboard');
}
