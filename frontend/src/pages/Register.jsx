import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, UserPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import useAuthStore from "../store/authStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = (form.get("name") || "").trim();
    const email = (form.get("email") || "").trim();
    const password = form.get("password") || "";

    // İstek gitmeden önce anlık UI validasyonu
    if (!name) {
      toast.error("Ad Soyad alanı boş olamaz.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      toast.error("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    const ok = await register(name, email, password);
    if (ok) {
      toast.success("Kayıt başarılı. Hoş geldiniz!");
      navigate("/");
    } else {
      toast.error(useAuthStore.getState().error || "Kayıt başarısız.");
    }
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <h1 className="text-2xl font-bold text-slate-900">Hesap oluşturun</h1>
        <p className="mt-1 text-sm text-slate-500">Randevu almaya hemen başlayın.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <TextField
            id="name"
            label="Ad Soyad"
            type="text"
            placeholder="Adınız Soyadınız"
            icon={User}
            autoComplete="name"
          />
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
            placeholder="En az 6 karakter"
            icon={Lock}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Kayıt yapılıyor…
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" /> Kayıt Ol
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Zaten hesabınız var mı?{" "}
          <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
            Giriş yapın
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
