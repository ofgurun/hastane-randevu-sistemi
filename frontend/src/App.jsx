import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LogOut, CheckCircle2 } from "lucide-react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import useAuthStore from "./store/authStore";

// GÜN 7 GEÇİCİ placeholder — giriş/kayıt akışının test edilebilmesi için.
// Gün 8'de gerçek "Hasta Ana Sayfası" (bölüm/doktor listesi) ile DEĞİŞTİRİLECEK.
// Not: burada Gün 8 işi (liste) YOK; yalnızca oturum doğrulama + çıkış.
function TempHome() {
  const { user, logout, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <CheckCircle2 className="h-12 w-12 text-green-500" />
      <h1 className="text-2xl font-bold text-slate-900">Giriş başarılı 🎉</h1>
      <p className="text-slate-600">
        Hoş geldiniz, <span className="font-semibold">{user?.name}</span> ({user?.role}).
      </p>
      <p className="text-sm text-slate-400">
        Bu geçici bir sayfadır — gerçek Ana Sayfa Gün 8'de eklenecek.
      </p>
      <button
        onClick={logout}
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
      >
        <LogOut className="h-4 w-4" /> Çıkış Yap
      </button>
    </div>
  );
}

// Gün 6-7: yönlendirme + Login/Register + geçici korumalı ana sayfa.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Giriş yapılmışsa geçici ana sayfa, değilse /login'e yönlendir */}
        <Route path="/" element={<TempHome />} />
        {/* Bilinmeyen yollar → /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
