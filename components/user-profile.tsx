'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from './theme-toggle';

interface UserProfileData {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
}

export function UserProfile() {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUser(user as UserProfileData);
      setLoading(false);
    };

    fetchUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Redirect to sign in page or landing page after sign out.
    router.push('/signin');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='cursor-pointer'>
        <div className='relative'>
          {loading ? (
            <div className='flex h-8 w-8 items-center justify-center'>
              <Loader2 className='h-5 w-5 animate-spin' />
            </div>
          ) : (
            <Avatar className='h-8 w-8'>
              <AvatarImage
                src={`${user?.user_metadata.avatar_url}`}
                alt={
                  user?.user_metadata.full_name || user?.email || 'User avatar'
                }
              />
              <AvatarFallback>
                {user?.email ? user.email.charAt(0).toUpperCase() : '?'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-56'
      >
        <DropdownMenuItem>
          <div className='flex flex-col'>
            <span className='font-medium'>
              {user?.user_metadata.full_name || user?.email}
            </span>
            {user?.email && (
              <span className='text-muted-foreground text-xs'>
                {user.email}
              </span>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ThemeToggle />
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
