// Token debugging utility
export const debugTokenFlow = async () => {
  console.log('=== TOKEN DEBUG START ===');
  
  // Check current token state
  const currentToken = localStorage.getItem('accessToken');
  const currentRole = localStorage.getItem('role');
  
  console.log('Current token:', currentToken ? currentToken.substring(0, 30) + '...' : 'None');
  console.log('Current role:', currentRole || 'None');
  
  // Test refresh endpoint
  try {
    console.log('Testing refresh endpoint...');
    const response = await fetch('http://localhost:5000/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Refresh response status:', response.status);
    console.log('Refresh response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Refresh response data:', data);
      
      if (data.accessToken) {
        console.log('✅ Refresh successful - new token received');
        localStorage.setItem('accessToken', data.accessToken);
        if (data.role) {
          localStorage.setItem('role', data.role);
        }
        console.log('✅ Tokens updated in localStorage');
      } else {
        console.log('❌ No access token in response');
      }
    } else {
      const error = await response.json();
      console.log('❌ Refresh failed:', error);
    }
  } catch (err) {
    console.error('❌ Refresh error:', err);
  }
  
  // Check final state
  const finalToken = localStorage.getItem('accessToken');
  const finalRole = localStorage.getItem('role');
  
  console.log('Final token:', finalToken ? finalToken.substring(0, 30) + '...' : 'None');
  console.log('Final role:', finalRole || 'None');
  console.log('=== TOKEN DEBUG END ===');
};

// Test function for ProtectedRoute simulation
export const simulateProtectedRoute = async () => {
  console.log('=== PROTECTED ROUTE SIMULATION ===');
  
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('role');
  
  console.log('ProtectedRoute: Checking authentication...');
  console.log('ProtectedRoute: Access token present:', !!token);
  console.log('ProtectedRoute: Role:', role);
  
  if (token) {
    console.log('ProtectedRoute: Using existing access token');
    return { authed: true, role };
  }
  
  console.log('ProtectedRoute: No access token, attempting refresh...');
  
  try {
    const res = await fetch('http://localhost:5000/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('ProtectedRoute: Refresh response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('ProtectedRoute: Refresh successful, data:', data);
      
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.role) {
          localStorage.setItem('role', data.role);
        }
        console.log('ProtectedRoute: Authentication restored');
        return { authed: true, role: data.role };
      } else {
        console.log('ProtectedRoute: No access token in refresh response');
        return { authed: false, role: null };
      }
    } else {
      console.log('ProtectedRoute: Refresh failed, clearing auth data');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('role');
      return { authed: false, role: null };
    }
  } catch (err) {
    console.error('ProtectedRoute: Refresh error:', err);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    return { authed: false, role: null };
  }
};
