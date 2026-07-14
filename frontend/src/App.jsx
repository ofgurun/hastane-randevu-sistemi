import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Appointments from "./pages/Appointments";
import DoctorDashboard from "./pages/DoctorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

// Gün 6-13: merkezi güvenlik (ProtectedRoute/GuestRoute) + rol bazlı erişim.
function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Yalnızca misafir (giriş yapmamış) */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* Hasta sayfaları */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={["HASTA"]}>
              <Appointments />
            </ProtectedRoute>
          }
        />

        {/* Doktor sayfası */}
        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute allowedRoles={["DOKTOR"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Bilinmeyen yollar → /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
