import { useEffect, useState } from 'react';
import { getAccessToken, setAccessToken, API_URL } from '../api';

/**
 * Hook to initialize authentication on app mount
 * Automatically tries to refresh access token if missing but refresh token exists
 */
export function useAuthInit() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();

      // If we already have an access token, no need to refresh
      if (token) {
        console.log('✅ Access token found in localStorage');
        setIsInitialized(true);
        return;
      }

      // No access token, try to refresh if we have a refresh token cookie
      console.log('🔄 No access token found, checking for refresh token...');
      console.log('🍪 Current cookies:', document.cookie);
      console.log(`📍 Calling refresh endpoint: ${API_URL}/api/auth/refresh`);

      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('📥 Refresh response status:', res.status, res.statusText);

        if (res.ok) {
          const data = await res.json();
          console.log('📥 Refresh response data:', data);

          if (data.accessToken) {
            console.log('✅ New access token obtained from refresh token');
            setAccessToken(data.accessToken);

            if (data.role) {
              localStorage.setItem('role', data.role);
              console.log('✅ Role restored:', data.role);
            }
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.log('❌ Refresh failed:', res.status, errorData);
          console.log('ℹ️ No valid refresh token found');
        }
      } catch (err) {
        console.log('❌ Could not refresh token:', err.message);
        console.error('Full error:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  return isInitialized;
}

