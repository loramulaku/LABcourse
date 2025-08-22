// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // e lexon tokenin nga browseri
  if (!token) {
    return <Navigate to="/login" />; // nëse nuk ka token, ktheje te Login
  }
  return children; // nëse ka token, lejo faqen
};

export default ProtectedRoute;
