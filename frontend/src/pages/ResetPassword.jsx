import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { resetPassword } from "../services/profileService";

const inputCls =
  "h-[46px] w-full rounded-[11px] border border-stone-200 bg-stone-50 px-3.5 text-[14.5px] text-stone-800 outline-none transition focus:border-teal-500";

// Şifre sıfırlama — e-postadaki bağlantıdaki ?token ile yeni şifre belirle.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (next !== confirm) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, next);
      toast.success("Şifreniz güncellendi. Giriş yapabilirsiniz.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Şifre sıfırlanamadı.");
    } finally {
      setLoading(false);
    }
  };

  // Token yoksa geçersiz bağlantı ekranı
  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-stone-800">Geçersiz bağlantı</h2>
          <p className="mb-6 text-sm leading-relaxed text-stone-500">
            Sıfırlama bağlantısı eksik veya hatalı. Lütfen yeniden şifre sıfırlama talebinde bulunun.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-teal-600 px-5 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            Yeni bağlantı iste
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
        <ShieldCheck className="h-6 w-6 text-teal-600" />
      </div>
      <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-stone-800">Yeni şifre belirleyin</h2>
      <p className="mb-6 text-sm text-stone-500">Hesabınız için yeni bir şifre oluşturun.</p>

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-stone-600">
            Yeni Şifre <span className="font-medium text-stone-400">(en az 6)</span>
          </span>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="••••••••" autoComplete="new-password" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-stone-600">Yeni Şifre (Tekrar)</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" className={inputCls} />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-12 items-center justify-center gap-2 rounded-[11px] bg-teal-600 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(13,148,136,.28)] transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null} Şifreyi Sıfırla
        </button>
      </form>
    </AuthLayout>
  );
}
