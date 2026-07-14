import { Building2, Stethoscope, MailWarning, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";

// Admin Paneli — bu adımda yalnızca giriş + iskelet.
// Bölüm/doktor yönetimi ve hatırlatma e-postaları sonraki adımlarda eklenecek.
const upcoming = [
  { icon: Building2, title: "Bölüm Yönetimi", desc: "Randevu alınabilecek bölümleri ekleyin." },
  { icon: Stethoscope, title: "Doktor Yönetimi", desc: "Bölümlere doktor tanımlayın." },
  { icon: MailWarning, title: "Hatırlatma E-postaları", desc: "Randevu öncesi otomatik hatırlatma." },
];

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Yönetim Paneli</h1>
            <p className="text-slate-500">
              Hoş geldiniz, <span className="font-semibold">{user?.name}</span>.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {upcoming.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
              <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-400">
                Yakında
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
