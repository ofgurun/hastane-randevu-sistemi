import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

// Gün 6-8: yönlendirme + Login/Register + Hasta Ana Sayfası.
// Home içinde oturum kontrolü var (giriş yoksa /login'e yönlendirir).
// Kalıcı ProtectedRoute sarmalayıcısı Gün 13'te eklenecek.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        {/* Bilinmeyen yollar → /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
