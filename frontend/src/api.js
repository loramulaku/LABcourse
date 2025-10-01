// Empty string for relative paths (uses Vite proxy), or full URL for direct calls
export const API_URL = import.meta.env.VITE_API_URL || "";

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}
export function setAccessToken(token) {
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
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
    try {
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!refreshRes.ok) {
        // Clear all session data
        setAccessToken(null);
        localStorage.removeItem("role");
        // Only redirect if we're not already on login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        throw new Error("Session expired");
      }
      const data = await refreshRes.json();
      if (!data.accessToken) throw new Error("No access token from refresh");
      setAccessToken(data.accessToken);
      if (data.role) {
        localStorage.setItem("role", data.role);
      }
      token = data.accessToken;
      fetchOptions.headers["Authorization"] = `Bearer ${token}`;
      response = await fetch(url, fetchOptions);
    } catch (err) {
      // Clear all session data
      setAccessToken(null);
      localStorage.removeItem("role");
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
