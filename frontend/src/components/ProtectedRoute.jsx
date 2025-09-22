import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken, setAccessToken } from "../api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ProtectedRoute = ({ children, requireRole }) => {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const tryRefresh = async () => {
      const token = getAccessToken();
      const localRole = localStorage.getItem("role");

      // If we have a valid access token, use it
      if (token) {
        setRole(localRole);
        setAuthed(true);
        setLoading(false);
        return;
      }

      // Only try to refresh if we don't have an access token
      // Check if we have any stored session data first
      const hasStoredSession = localStorage.getItem("role") || document.cookie.includes("refreshToken");
      
      if (!hasStoredSession) {
        // No session data at all, redirect to login
        setAuthed(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          // Clear any stale session data
          localStorage.removeItem("role");
          setAccessToken(null);
          throw new Error("Refresh failed");
        }

        const data = await res.json();

        if (data.accessToken) {
          setAccessToken(data.accessToken);

          if (data.role) {
            localStorage.setItem("role", data.role);
            setRole(data.role);
          } else {
            setRole(localRole);
          }

          setAuthed(true);
        } else {
          setAuthed(false);
        }
      } catch (err) {
        console.error("❌ Refresh error:", err);
        // Clear any stale session data on error
        localStorage.removeItem("role");
        setAccessToken(null);
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    };

    tryRefresh();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!authed) return <Navigate to="/login" replace />;
  if (requireRole && role !== requireRole) return <Navigate to="/" replace />;

  // Additional check for doctor role - ensure they have access token (approved)
  if (requireRole === 'doctor') {
    const token = getAccessToken();
    if (!token) return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
