import { Link, useLocation } from "react-router-dom";

// Misafir ekranı kabuğu — solda teal gradyan tanıtım paneli,
// sağda Giriş/Kayıt segmenti + form.
export default function AuthLayout({ children }) {
  const { pathname } = useLocation();
  const isLogin = pathname === "/login";

  const segCls = (active) =>
    `h-10 flex-1 rounded-[9px] text-center text-sm font-bold leading-10 transition ${
      active ? "bg-white text-teal-600 shadow-[0_2px_6px_rgba(0,0,0,.06)]" : "text-stone-500 hover:text-stone-700"
    }`;

  return (
    <div className="grid min-h-screen animate-fadeUp lg:grid-cols-[1.05fr_.95fr]">
      {/* Sol tanıtım paneli */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 p-14 text-white lg:flex">
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-white/[.07]" />
        <div className="absolute -bottom-24 -left-16 h-[300px] w-[300px] rounded-full bg-white/[.06]" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[.16] backdrop-blur-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 6v12M6 12h12" />
            </svg>
          </div>
          <div className="text-xl font-extrabold">MediRandevu</div>
        </div>

        <div className="relative">
          <h1 className="mb-[18px] text-[40px] font-extrabold leading-[1.12] tracking-tight [text-wrap:balance]">
            Sağlığınız için
            <br />
            doğru randevu,
            <br />
            tek dokunuşla.
          </h1>
          <p className="max-w-[420px] text-base leading-relaxed text-white/85">
            Uzman doktorlarımızla dakikalar içinde randevunuzu oluşturun. Bölümü seçin, uygun günü
            bulun, saatinizi ayırın.
          </p>
          <div className="mt-9 flex gap-7">
            <div>
              <div className="text-[28px] font-extrabold">40+</div>
              <div className="text-[13px] text-white/75">Uzman Doktor</div>
            </div>
            <div>
              <div className="text-[28px] font-extrabold">9</div>
              <div className="text-[13px] text-white/75">Bölüm</div>
            </div>
            <div>
              <div className="text-[28px] font-extrabold">7/24</div>
              <div className="text-[13px] text-white/75">Online Erişim</div>
            </div>
          </div>
        </div>

        <div className="relative text-[13px] text-white/70">© 2026 MediRandevu Sağlık Merkezi</div>
      </div>

      {/* Sağ form paneli */}
      <div className="flex items-center justify-center bg-white px-8 py-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-7 flex gap-1 rounded-xl bg-stone-100 p-1">
            <Link to="/login" className={segCls(isLogin)}>
              Giriş Yap
            </Link>
            <Link to="/register" className={segCls(!isLogin)}>
              Kayıt Ol
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
