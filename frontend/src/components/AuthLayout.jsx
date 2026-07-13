import { ShieldCheck, CalendarCheck, Clock } from "lucide-react";
import Logo from "./Logo";

const features = [
  { icon: CalendarCheck, title: "Kolay Randevu", desc: "Dakikalar içinde uygun doktordan randevu alın." },
  { icon: Clock, title: "7/24 Erişim", desc: "Randevularınızı istediğiniz an görüntüleyin ve yönetin." },
  { icon: ShieldCheck, title: "Güvenli", desc: "Kişisel bilgileriniz güvenle korunur." },
];

// Login/Register sayfalarının paylaşılan iki sütunlu düzeni:
// solda marka paneli (koyu mavi/lacivert), sağda form kartı.
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Sol marka paneli (yalnızca büyük ekran) */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-blue-400/20 blur-2xl" />

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-tight">Sağlığınız için doğru adres</h2>
          <p className="mt-3 max-w-md text-blue-100">
            Hastane randevularınızı tek yerden, hızlı ve güvenli bir şekilde yönetin.
          </p>
          <ul className="mt-8 space-y-5">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-blue-100/80">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-blue-200/70">© 2026 MediRandevu · Tüm hakları saklıdır.</p>
      </div>

      {/* Sağ içerik (form) */}
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
