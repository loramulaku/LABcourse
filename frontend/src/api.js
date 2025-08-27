// src/api.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// helper: marrë token nga localStorage
export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

// helper: vendos token në localStorage
export function setAccessToken(token) {
  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
}

// funksioni kryesor për fetch me Authorization + auto-refresh
export default async function apiFetch(url, options = {}) {
  let token = getAccessToken();

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
    credentials: "include", // 🔑 gjithmonë për cookie refreshToken
  };

  let response = await fetch(url, fetchOptions);

  // nëse access token ka skaduar
  if (response.status === 401 || response.status === 403) {
    try {
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include", // 🔑 cookie bartet këtu
      });

      if (!refreshRes.ok) {
        setAccessToken(null);
        alert("Seanca ka skaduar. Ju lutem logohuni përsëri.");
        window.location.href = "/login";
        return Promise.reject({ message: "Seanca ka skaduar" });
      }

      const data = await refreshRes.json();
      if (!data.accessToken) {
        setAccessToken(null);
        alert("Gabim me seancën. Ju lutem logohuni përsëri.");
        window.location.href = "/login";
        return Promise.reject({ message: "Mungon access token nga refresh" });
      }

      // ✅ ruaj tokenin e ri dhe riprovo request-in
      setAccessToken(data.accessToken);
      token = data.accessToken;
      fetchOptions.headers["Authorization"] = `Bearer ${token}`;

      response = await fetch(url, fetchOptions);
    } catch (err) {
      console.error("Refresh token error:", err);
      setAccessToken(null);
      alert("Gabim me seancën. Ju lutem logohuni përsëri.");
      window.location.href = "/login";
      return Promise.reject(err);
    }
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) return Promise.reject(json);
  return json;
}
