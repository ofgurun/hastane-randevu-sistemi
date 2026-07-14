import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import useAuthStore from "../store/authStore";
import { homePathForRole } from "../utils/roleRedirect";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = (form.get("email") || "").trim();
    const password = form.get("password") || "";

    // İstek gitmeden önce anlık UI validasyonu
    if (!EMAIL_RE.test(email)) {
      toast.error("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    const ok = await login(email, password);
    if (ok) {
      toast.success("Giriş başarılı.");
      // Rol bazlı yönlendirme: admin → panel, doktor → ajanda, hasta → ana sayfa.
      const role = useAuthStore.getState().user?.role;
      navigate(homePathForRole(role));
    } else {
      toast.error(useAuthStore.getState().error || "Giriş başarısız.");
    }
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <h1 className="text-2xl font-bold text-slate-900">Tekrar hoş geldiniz</h1>
        <p className="mt-1 text-sm text-slate-500">Randevularınıza erişmek için giriş yapın.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
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
