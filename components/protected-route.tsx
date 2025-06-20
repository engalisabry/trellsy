'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = '/auth/login',
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return (
      fallback || (
        <div className='flex min-h-screen items-center justify-center'>
          <div className='flex flex-col items-center gap-4'>
            <LoaderCircle className='h-8 w-8 animate-spin' />
            <p className='text-muted-foreground text-sm'>Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string; fallback?: React.ReactNode },
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
