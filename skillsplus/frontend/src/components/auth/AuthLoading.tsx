import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/authStore';
import apiClient, { authAPI } from '@/lib/api-client';

interface AuthLoadingProps {
  children: React.ReactNode;
}

export function AuthLoading({ children }: AuthLoadingProps) {
  const auth = useAuth();
  const [initAttempted, setInitAttempted] = useState(false);

  // If we have an access token, attempt to load the user profile
  useEffect(() => {
    async function loadUserProfile() {
      // Only attempt to load the profile if:
      // 1. We have an access token
      // 2. We don't have a user object already
      // 3. We're not currently loading
      // 4. We haven't tried initialization yet
      if (auth.accessToken && !auth.user && !auth.isLoading && !initAttempted) {
        try {
          auth.setIsLoading(true);
          const response = await authAPI.getProfile();
          if (response.user) {
            auth.setUser(response.user);
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // If loading profile fails, try refreshing the token
          // If that fails too, the refresh interceptor will handle it
        } finally {
          auth.setIsLoading(false);
          setInitAttempted(true);
        }
      }
    }

    loadUserProfile();
  }, [auth, initAttempted]);

  // If auth is still initializing and we're not in a loading state, show a spinner
  if (!auth.initialized && !initAttempted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Auth is initialized, render children
  return <>{children}</>;
} 