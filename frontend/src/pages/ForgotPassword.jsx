import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../components/AuthLayout";
import { forgotPassword } from "../services/profileService";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  "h-[46px] w-full rounded-[11px] border border-stone-200 bg-stone-50 px-3.5 text-[14.5px] text-stone-800 outline-none transition focus:border-teal-500";

// Şifremi unuttum — e-posta gir, sıfırlama bağlantısı iste.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Geçerli bir e-posta adresi girin.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "İşlem yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
            <MailCheck className="h-7 w-7 text-teal-600" />
          </div>
          <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-stone-800">E-postanızı kontrol edin</h2>
          <p className="mb-6 text-sm leading-relaxed text-stone-500">
            Eğer <b className="text-stone-700">{email}</b> adresi kayıtlıysa, şifre sıfırlama
            bağlantısı gönderildi. Bağlantı 1 saat geçerlidir.
          </p>
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-teal-600 px-5 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            Girişe dön
          </Link>
        </div>
      ) : (
        <>
          <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-stone-800">Şifremi unuttum</h2>
          <p className="mb-6 text-sm text-stone-500">
            Hesabınızın e-posta adresini girin; size bir sıfırlama bağlantısı gönderelim.
          </p>
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-stone-600">E-posta</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@eposta.com"
                autoComplete="email"
                className={inputCls}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-12 items-center justify-center gap-2 rounded-[11px] bg-teal-600 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(13,148,136,.28)] transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null} Sıfırlama Bağlantısı Gönder
            </button>
          </form>
          <Link
            to="/login"
            className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-stone-500 transition hover:text-stone-700"
          >
            <ArrowLeft className="h-4 w-4" /> Girişe dön
          </Link>
        </>
      )}
    </AuthLayout>
  );
}
