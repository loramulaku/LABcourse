import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken, setAccessToken, setRole, getRole, clearAuth, validateUserRole } from "../api";

const ProtectedRoute = ({ children, requireRole }) => {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [role, setRoleState] = useState(null);

  useEffect(() => {
    // Listen for automatic token refresh events
    const handleTokenRefreshed = (event) => {
      console.log('[ProtectedRoute] Token refreshed automatically:', event.detail);
      setAccessToken(event.detail.accessToken);
      setRole(event.detail.role);
      setRoleState(event.detail.role);
      setAuthed(true);
      setLoading(false);
    };

    const handleTokenRefreshFailed = () => {
      console.log('[ProtectedRoute] Automatic token refresh failed');
      setAuthed(false);
      setLoading(false);
    };

    // Add event listeners
    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    window.addEventListener('tokenRefreshFailed', handleTokenRefreshFailed);

    const tryRefresh = async () => {
      const token = getAccessToken();

      console.log('=== FRONTEND PROTECTED ROUTE DEBUG START ===');
      console.log('[ProtectedRoute] Checking authentication at:', new Date().toISOString());
      console.log('[ProtectedRoute] Access token present:', !!token);
      console.log('[ProtectedRoute] Access token (first 30 chars):', token ? token.substring(0, 30) + '...' : 'NONE');
      console.log('[ProtectedRoute] Require role:', requireRole);

      // If we have a valid access token, validate role with server
      if (token) {
        console.log('[ProtectedRoute] ✅ Access token present, validating role with server...');
        
        try {
          const serverRole = await validateUserRole();
          if (serverRole) {
            console.log('[ProtectedRoute] ✅ Server-validated role:', serverRole);
            setRoleState(serverRole);
            setAuthed(true);
            setLoading(false);
            console.log('=== FRONTEND PROTECTED ROUTE DEBUG END ===');
            return;
          } else {
            console.log('[ProtectedRoute] ❌ Server role validation failed');
            setAuthed(false);
            setLoading(false);
            console.log('=== FRONTEND PROTECTED ROUTE DEBUG END ===');
            return;
          }
        } catch (error) {
          console.error('[ProtectedRoute] ❌ Server role validation error:', error);
          setAuthed(false);
          setLoading(false);
          console.log('=== FRONTEND PROTECTED ROUTE DEBUG END ===');
          return;
        }
      }

      // No access token - try to refresh
      console.log('[ProtectedRoute] ❌ No access token, attempting refresh...');
      console.log('[ProtectedRoute] Using full URL for refresh request');
      
      try {
        console.log('[ProtectedRoute] Making refresh request...');
        const res = await fetch(`http://localhost:5000/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          }
        });

        console.log('[ProtectedRoute] Refresh response status:', res.status);
        console.log('[ProtectedRoute] Refresh response headers:', Object.fromEntries(res.headers.entries()));

        if (res.ok) {
          const data = await res.json();
          console.log('[ProtectedRoute] ✅ Refresh successful, data:', { 
            hasAccessToken: !!data.accessToken, 
            role: data.role,
            accessTokenPreview: data.accessToken ? data.accessToken.substring(0, 30) + '...' : 'NONE'
          });

          if (data.accessToken) {
            console.log('[ProtectedRoute] Setting new access token...');
            setAccessToken(data.accessToken);

            if (data.role) {
              console.log('[ProtectedRoute] Setting new role:', data.role);
              setRole(data.role);
              setRoleState(data.role);
            } else {
              console.log('[ProtectedRoute] No role in response, keeping existing:', localRole);
              setRoleState(localRole);
            }

            setAuthed(true);
            console.log('[ProtectedRoute] ✅ Authentication restored successfully');
            console.log('=== FRONTEND PROTECTED ROUTE DEBUG END ===');
          } else {
            console.log('[ProtectedRoute] ❌ No access token in refresh response');
            setAuthed(false);
            console.log('=== FRONTEND PROTECTED ROUTE DEBUG END ===');
          }
        } else {
          // Refresh failed
          console.log('[ProtectedRoute] ❌ Refresh failed, status:', res.status);
          const errorData = await res.json().catch(() => ({}));
          console.log('[ProtectedRoute] Error data:', errorData);
          console.log('[ProtectedRoute] Clearing auth data...');
          clearAuth();
          setAuthed(false);
          console.log('=== FRONTEND PROTECTED ROUTE DEBUG END ===');
        }
      } catch (err) {
        console.error("[ProtectedRoute] ❌ Refresh error:", err);
        console.log('[ProtectedRoute] Clearing auth data due to error...');
        clearAuth();
        setAuthed(false);
        console.log('=== FRONTEND PROTECTED ROUTE DEBUG END ===');
      } finally {
        setLoading(false);
      }
    };

    tryRefresh();

    // Cleanup event listeners
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
      window.removeEventListener('tokenRefreshFailed', handleTokenRefreshFailed);
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!authed) return <Navigate to="/login" replace />;
  if (requireRole && role !== requireRole) return <Navigate to="/" replace />;

  // Additional check for doctor role - ensure they have access token (approved)
  // This check is now handled by the main authentication flow above
  // No need for additional token checks since refresh logic handles it

  return children;
};

export default ProtectedRoute;
