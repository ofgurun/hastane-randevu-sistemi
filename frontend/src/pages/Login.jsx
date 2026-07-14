import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Loader2, AlertCircle } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import useAuthStore from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  // Sayfa açılışında önceki hatayı temizle
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const ok = await login(form.get("email"), form.get("password"));
    if (ok) navigate("/");
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <h1 className="text-2xl font-bold text-slate-900">Tekrar hoş geldiniz</h1>
        <p className="mt-1 text-sm text-slate-500">Randevularınıza erişmek için giriş yapın.</p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Giriş yapılıyor…
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" /> Giriş Yap
              </>
            )}
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
