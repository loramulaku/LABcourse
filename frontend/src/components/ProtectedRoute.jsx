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

      if (token) {
        setRole(localRole);
        setAuthed(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) throw new Error("No refresh");

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

  return children;
};

export default ProtectedRoute;
