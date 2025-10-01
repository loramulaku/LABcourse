import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken, setAccessToken, API_URL } from "../api";

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

      // No access token - try to refresh
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (res.ok) {
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
        } else {
          // Refresh failed
          localStorage.removeItem("role");
          setAccessToken(null);
          setAuthed(false);
        }
      } catch (err) {
        console.error("Refresh error:", err);
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
