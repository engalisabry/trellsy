'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { OrganizationProfile } from '@/components/organization-profile';
import { handleError } from '@/lib/utils/error-handling';
import { useOrganizationStore } from '@/lib/stores';
import { createClient } from '@/lib/supabase/client';

const OrganizationPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authDebug, setAuthDebug] = useState({});
  const {
    fetchOrganizations,
    organizations,
    error: orgError,
  } = useOrganizationStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();

        // Use getUser() for secure authentication (no need for session)
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        const debugInfo = {
          hasUser: !!userData.user,
          userId: userData.user?.id,
          email: userData.user?.email,
          error: userError?.message || null,
        };

        setAuthDebug(debugInfo);

        if (userData.user && !userError) {
          setUser(userData.user);

          try {
            await fetchOrganizations();
          } catch (error) {
            handleError('auth');
            return false;
          }
        } else {
          // Redirect to login if no valid user
          window.location.href = '/auth/login';
          return;
        }

        setIsLoading(false);
      } catch (error) {
        handleError('auth');
        setIsLoading(false);
        return false;
      }
    };

    checkAuth();
  }, [fetchOrganizations]);

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p>Loading...</p>
      </div>
    );
  }

  return <OrganizationProfile />;

  // return (
  //   <div className='p-4'>
  //     <h1 className='text-2xl font-bold'>
  //       Organization Dashboard - Debug Mode
  //     </h1>

  //     <div className='mt-4 rounded bg-gray-100 p-4'>
  //       <h2 className='mb-2 font-bold'>Auth Debug Info:</h2>
  //       <pre className='text-xs'>{JSON.stringify(authDebug, null, 2)}</pre>
  //     </div>

  //     {user ? (
  //       <div className='mt-4'>
  //         <p className='mt-2'>Welcome, {user.email}</p>
  //         <p>User ID: {user.id}</p>

  //         <div className='mt-4 rounded bg-blue-100 p-4'>
  //           <h3 className='mb-2 font-bold'>Organizations:</h3>
  //           {orgError ? (
  //             <p className='text-red-600'>Error: {orgError.message}</p>
  //           ) : (
  //             <pre className='text-xs'>
  //               {JSON.stringify(organizations, null, 2)}
  //             </pre>
  //           )}
  //         </div>
  //       </div>
  //     ) : (
  //       <div className='mt-4'>
  //         <p>Not authenticated</p>
  //         <a
  //           href='/auth/login'
  //           className='mt-4 text-blue-500 underline'
  //         >
  //           Go to Login
  //         </a>
  //       </div>
  //     )}
  //   </div>
  // );
};

export default OrganizationPage;
