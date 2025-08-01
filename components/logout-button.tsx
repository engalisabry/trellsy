'use client';

import { useState } from 'react';
import { LoaderCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearAuthCache, useAuth } from '@/hooks/use-auth';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LogoutButton({
  variant = 'default',
  size = 'default',
  showIcon = true,
  children = 'Logout',
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    if (isLoggingOut || !user) return;

    try {
      setIsLoggingOut(true);
      // Clear local auth cache first
      clearAuthCache();
      // Then perform logout
      await signOut();
      // Now handle the redirect with router
      window.location.href = '/auth/login'; // Using window.location for a complete refresh
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return null; // Don't show logout button if not authenticated
  }

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      disabled={isLoggingOut}
      className='flex items-center gap-2'
    >
      {isLoggingOut ? (
        <LoaderCircle className='h-4 w-4 animate-spin' />
      ) : (
        showIcon && <LogOut className='h-4 w-4' />
      )}
      {isLoggingOut ? 'Signing out...' : children}
    </Button>
  );
}
