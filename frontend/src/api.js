// Empty string for relative paths (uses Vite proxy), or full URL for direct calls
export const API_URL = import.meta.env.VITE_API_URL || "";

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem("accessToken", token);
    console.log('[TOKEN] Access token set:', token.substring(0, 30) + '...');
  } else {
    localStorage.removeItem("accessToken");
    console.log('[TOKEN] Access token cleared');
  }
}

// SECURITY: Role is now validated server-side only
// Frontend role storage is for UI display only and cannot be trusted
export function setRole(role) {
  if (role) {
    localStorage.setItem("role", role);
    console.log('[TOKEN] Role set (UI only):', role);
  } else {
    localStorage.removeItem("role");
    console.log('[TOKEN] Role cleared');
  }
}

export function getRole() {
  return localStorage.getItem("role");
}

// SECURITY: Always validate role with server
export async function validateUserRole() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/validate-role', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // SECURITY CHECK: Compare server role with localStorage role
      const localRole = localStorage.getItem('role');
      if (localRole && localRole !== data.role) {
        console.log('[SECURITY] ⚠️ Role mismatch detected! Local:', localRole, 'Server:', data.role);
        console.log('[SECURITY] Possible tampering attempt - logging out user');
        
        // Call logout to clear refresh token from server
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Clear local auth data
        clearAuth();
        return null;
      }
      
      // Update local storage with server-validated role
      setRole(data.role);
      return data.role;
    } else {
      // Server says role is invalid, logout completely
      console.log('[SECURITY] Role validation failed - logging out');
      
      // Call logout to clear refresh token from server
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      clearAuth();
      return null;
    }
  } catch (error) {
    console.error('[TOKEN] Role validation error:', error);
    
    // Call logout to clear refresh token from server
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (logoutError) {
      console.error('[TOKEN] Logout error:', logoutError);
    }
    
    clearAuth();
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("role");
  localStorage.removeItem("userName");
  console.log('[TOKEN] All auth data cleared');
}

// SECURITY: Complete logout - clears both frontend and backend tokens
export async function secureLogout() {
  console.log('[SECURITY] Performing secure logout...');
  
  try {
    // Call backend logout to clear refresh token
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('[SECURITY] ✅ Backend logout successful');
  } catch (error) {
    console.error('[SECURITY] Backend logout error:', error);
  } finally {
    // Always clear frontend data
    clearAuth();
    console.log('[SECURITY] ✅ Complete logout finished');
  }
}

export default async function apiFetch(url, options = {}) {
  let token = getAccessToken();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const fetchOptions = { ...options, headers, credentials: "include" };
  let response = await fetch(url, fetchOptions);

  if (response.status === 401 || response.status === 403) {
    console.log('[TOKEN] Access token invalid, attempting refresh...');
    try {
      const refreshRes = await fetch(`http://localhost:5000/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!refreshRes.ok) {
        console.log('[TOKEN] Refresh failed, clearing auth data');
        clearAuth();
        // Only redirect if we're not already on login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        throw new Error("Session expired");
      }
      
      const data = await refreshRes.json();
      if (!data.accessToken) {
        console.log('[TOKEN] No access token in refresh response');
        throw new Error("No access token from refresh");
      }
      
      console.log('[TOKEN] Refresh successful, updating tokens');
      setAccessToken(data.accessToken);
      if (data.role) {
        setRole(data.role);
      }
      
      token = data.accessToken;
      fetchOptions.headers["Authorization"] = `Bearer ${token}`;
      response = await fetch(url, fetchOptions);
    } catch (err) {
      console.log('[TOKEN] Refresh error:', err.message);
      clearAuth();
      // Only redirect if we're not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw err;
    }
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw json;
  return json;
}

// Global token monitoring system
let tokenMonitorInterval = null;
let isRefreshing = false;

// Start monitoring for token changes
export function startTokenMonitoring() {
  if (tokenMonitorInterval) return; // Already monitoring
  
  console.log('[TOKEN] Starting token monitoring...');
  
  tokenMonitorInterval = setInterval(() => {
    const currentToken = getAccessToken();
    const currentRole = getRole();
    
    // If we have a role but no token, try to refresh
    if (currentRole && !currentToken && !isRefreshing) {
      console.log('[TOKEN] Detected missing access token, attempting refresh...');
      attemptTokenRefresh();
    }
  }, 1000); // Check every second
}

// Stop monitoring
export function stopTokenMonitoring() {
  if (tokenMonitorInterval) {
    clearInterval(tokenMonitorInterval);
    tokenMonitorInterval = null;
    console.log('[TOKEN] Token monitoring stopped');
  }
}

// Attempt to refresh the token
async function attemptTokenRefresh() {
  if (isRefreshing) return; // Prevent multiple simultaneous refreshes
  
  isRefreshing = true;
  console.log('[TOKEN] Starting automatic token refresh...');
  
  try {
    const res = await fetch('http://localhost:5000/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('[TOKEN] Refresh response status:', res.status);

    if (res.ok) {
      const data = await res.json();
      console.log('[TOKEN] ✅ Automatic refresh successful!');
      
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        
        if (data.role) {
          setRole(data.role);
        }
        
        console.log('[TOKEN] ✅ Authentication restored automatically');
        
        // Dispatch a custom event to notify components
        window.dispatchEvent(new CustomEvent('tokenRefreshed', { 
          detail: { accessToken: data.accessToken, role: data.role } 
        }));
      }
    } else {
      console.log('[TOKEN] ❌ Automatic refresh failed, status:', res.status);
      // If refresh fails, clear auth data
      clearAuth();
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
    }
  } catch (err) {
    console.log('[TOKEN] ❌ Automatic refresh error:', err.message);
    clearAuth();
    window.dispatchEvent(new CustomEvent('tokenRefreshFailed'));
  } finally {
    isRefreshing = false;
  }
}
