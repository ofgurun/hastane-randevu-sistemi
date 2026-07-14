import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Appointments from "./pages/Appointments";
import DoctorDashboard from "./pages/DoctorDashboard";

// Gün 6-11: yönlendirme + Login/Register + Ana Sayfa + Randevularım + Doktor Ajandası.
// Sayfalar içinde oturum/rol kontrolü var (DoctorDashboard yalnızca DOKTOR).
// Kalıcı ProtectedRoute sarmalayıcısı Gün 13'te eklenecek.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        {/* Bilinmeyen yollar → /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
