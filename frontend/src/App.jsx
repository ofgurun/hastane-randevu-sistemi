import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Appointments from "./pages/Appointments";

// Gün 6-10: yönlendirme + Login/Register + Ana Sayfa + Randevularım.
// Home/Appointments içinde oturum kontrolü var (giriş yoksa /login'e yönlendirir).
// Kalıcı ProtectedRoute sarmalayıcısı Gün 13'te eklenecek.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/appointments" element={<Appointments />} />
        {/* Bilinmeyen yollar → /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
