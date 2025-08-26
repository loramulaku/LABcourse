// src/api.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/";


// helper: marrë token nga localStorage
export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

// helper: vendos token në localStorage
export function setAccessToken(token) {
  localStorage.setItem("accessToken", token);
}

// funksioni kryesor për fetch me Authorization + auto-refresh
export default async function apiFetch(url, options = {}) {
  const token = getAccessToken();

  const headers = {
    ...(options.headers || {}),
  };

  // ⚡️ vendos Content-Type vetëm kur body nuk është FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const fetchOptions = {
    ...options,
    headers,
    credentials: "include", // lejon cookies (refresh token)
  };

  let response = await fetch(url, fetchOptions);

  // nëse access token ka skaduar
  if (response.status === 401 || response.status === 403) {
    try {
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!refreshRes.ok) {
        localStorage.removeItem("accessToken");
        alert("Seanca ka skaduar. Ju lutem logohuni përsëri.");
        window.location.href = "/login";
        return Promise.reject({ message: "Seanca ka skaduar" });
      }

      const data = await refreshRes.json();
      setAccessToken(data.accessToken);

      fetchOptions.headers["Authorization"] = `Bearer ${data.accessToken}`;
      response = await fetch(url, fetchOptions);
    } catch (err) {
      console.error("Refresh token error:", err);
      localStorage.removeItem("accessToken");
      alert("Gabim me seancën. Ju lutem logohuni përsëri.");
      window.location.href = "/login";
      return Promise.reject(err);
    }
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) return Promise.reject(json);
  return json;
}