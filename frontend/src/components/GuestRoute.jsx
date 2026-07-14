import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { homePathForRole } from "../utils/roleRedirect";

// Yalnızca giriş yapmamışlar için (login/register). Giriş yapmış kullanıcı
// otomatik olarak rolüne uygun ana sayfaya yönlendirilir.
export default function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={homePathForRole(user?.role)} replace />;
  }

  return children;
}
