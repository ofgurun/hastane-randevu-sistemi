import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

// Merkezi güvenlik: giriş yoksa /login'e; allowedRoles verilmişse ve rol uymuyorsa
// kullanıcının kendi ana sayfasına yönlendirir.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Yanlış rol → güvenli sayfa (doktor ajandaya, diğerleri ana sayfaya)
    return <Navigate to={user?.role === "DOKTOR" ? "/doctor-dashboard" : "/"} replace />;
  }

  return children;
}
