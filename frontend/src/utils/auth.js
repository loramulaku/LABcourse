// Get access token from localStorage
export function getAccessToken() {
  return localStorage.getItem('accessToken');
}

// Set access token in localStorage
export function setAccessToken(token) {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

// Get user role from localStorage
export function getRole() {
  return localStorage.getItem('role');
}

// Set user role in localStorage
export function setRole(role) {
  if (role) {
    localStorage.setItem('role', role);
  } else {
    localStorage.removeItem('role');
  }
}

// Clear all auth data from localStorage
export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('role');
}