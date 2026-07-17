import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import useAuthStore from "../store/authStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  "h-[46px] w-full rounded-[11px] border border-stone-200 bg-stone-50 px-3.5 text-[14.5px] text-stone-800 outline-none transition focus:border-teal-500";

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
      toast.success("Kayıt tamamlandı. Hoş geldiniz!");
      navigate("/");
    } else {
      toast.error(useAuthStore.getState().error || "Kayıt başarısız.");
    }
  };

  return (
    <AuthLayout>
      <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-stone-800">
        Aramıza katılın
      </h2>
      <p className="mb-6 text-sm text-stone-500">Yeni hasta hesabı oluşturun.</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-stone-600">Ad Soyad</span>
          <input name="name" type="text" placeholder="Adınız Soyadınız" autoComplete="name" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-stone-600">E-posta</span>
          <input name="email" type="email" placeholder="ornek@eposta.com" autoComplete="email" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-stone-600">
            Şifre <span className="font-medium text-stone-400">(en az 6 karakter)</span>
          </span>
          <input name="password" type="password" placeholder="••••••••" autoComplete="new-password" className={inputCls} />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 flex h-12 items-center justify-center gap-2 rounded-[11px] bg-teal-600 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(13,148,136,.28)] transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Kayıt yapılıyor…
            </>
          ) : (
            "Kayıt Ol"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
