import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className='flex h-svh w-full items-center justify-center gap-2'>
      <ThemeToggle />
      <p>
        Hello <span>{user?.email}</span>
      </p>
      <LogoutButton />
    </div>
  );
}
