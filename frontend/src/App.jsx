import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Appointments from "./pages/Appointments";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

// Gün 6-13: merkezi güvenlik (ProtectedRoute/GuestRoute) + rol bazlı erişim.
function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#fff",
            color: "#292524",
            border: "1px solid #e7e5e4",
            borderRadius: "13px",
            boxShadow: "0 16px 40px rgba(28,25,23,.18)",
            fontSize: "13.5px",
            fontWeight: 600,
          },
          success: { iconTheme: { primary: "#059669", secondary: "#ecfdf5" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "#fef2f2" } },
        }}
      />
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
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPassword />
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

        {/* Profil — tüm giriş yapmış roller */}
        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <Profile />
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

        {/* Admin paneli */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
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
