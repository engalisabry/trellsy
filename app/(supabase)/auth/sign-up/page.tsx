import { redirect } from 'next/navigation';
import { SignUpForm } from '@/components/sign-up-form';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, redirect to protected page
  if (user) {
    redirect('/protected');
  }

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <SignUpForm />
      </div>
    </div>
  );
}
