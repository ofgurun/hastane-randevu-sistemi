import { Link } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";

export default function Login() {
  // Gün 6 — yalnızca UI. Form gönderimi ve API isteği Gün 7'de eklenecek.
  const handleSubmit = (e) => e.preventDefault();

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <h1 className="text-2xl font-bold text-slate-900">Tekrar hoş geldiniz</h1>
        <p className="mt-1 text-sm text-slate-500">Randevularınıza erişmek için giriş yapın.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <TextField
            id="email"
            label="E-posta"
            type="email"
            placeholder="ornek@eposta.com"
            icon={Mail}
            autoComplete="email"
          />
          <TextField
            id="password"
            label="Şifre"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            autoComplete="current-password"
          />

          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-[.99]"
          >
            <LogIn className="h-5 w-5" />
            Giriş Yap
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Hesabınız yok mu?{" "}
          <Link to="/register" className="font-semibold text-blue-700 hover:text-blue-800">
            Kayıt olun
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
