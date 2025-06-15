'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganizationStore } from '@/lib/stores';
import { User } from '@supabase/supabase-js';

const OrganizationPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authDebug, setAuthDebug] = useState({});
  const { fetchOrganizations, organizations, error: orgError } = useOrganizationStore();
  
  useEffect(() => {
    // Simple client-side auth check
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        
        // If we're coming from an OAuth redirect (has 't' parameter), 
        // wait a moment and try to refresh the session
        const urlParams = new URLSearchParams(window.location.search);
        const isFromOAuth = urlParams.has('t');
        
        if (isFromOAuth) {
          console.log('Detected OAuth redirect, refreshing session...');
          // Wait a bit for cookies to propagate
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Try to refresh the session
          await supabase.auth.refreshSession();
        }
        
        const { data: sessionData } = await supabase.auth.getSession();
        const { data: userData } = await supabase.auth.getUser();
        
        const debugInfo = {
          hasSession: !!sessionData.session,
          hasUser: !!userData.user,
          sessionUserId: sessionData.session?.user?.id,
          userDataId: userData.user?.id,
          sessionExpiry: sessionData.session?.expires_at,
          cookies: document.cookie,
          isFromOAuth,
          error: ((sessionData as any).error?.message || (userData as any).error?.message) || null
        };
        
        console.log('Client-side auth debug:', debugInfo);
        setAuthDebug(debugInfo);
        
        if (sessionData.session) {
          setUser(sessionData.session.user);
          // Test organization fetching
          console.log('Testing organization fetch...');
          try {
            await fetchOrganizations();
            console.log('Organization fetch successful');
          } catch (error) {
            console.error('Organization fetch error:', error);
          }
        } else if (isFromOAuth) {
          // If we just came from OAuth but don't have a session, 
          // there might be a timing issue - try one more time
          console.log('No session found after OAuth, retrying in 2s...');
          setTimeout(checkAuth, 2000);
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Client auth error:', error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [fetchOrganizations]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className='p-4'>
      <h1 className="text-2xl font-bold">Organization Dashboard - Debug Mode</h1>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Auth Debug Info:</h2>
        <pre className="text-xs">{JSON.stringify(authDebug, null, 2)}</pre>
      </div>
      
      {user ? (
        <div className="mt-4">
          <p className="mt-2">Welcome, {user.email}</p>
          <p>User ID: {user.id}</p>
          
          <div className="mt-4 p-4 bg-blue-100 rounded">
            <h3 className="font-bold mb-2">Organizations:</h3>
            {orgError ? (
              <p className="text-red-600">Error: {orgError.message}</p>
            ) : (
              <pre className="text-xs">{JSON.stringify(organizations, null, 2)}</pre>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p>Not authenticated</p>
          <a href="/auth/login" className="mt-4 text-blue-500 underline">Go to Login</a>
        </div>
      )}
    </div>
  );
};

export default OrganizationPage;
