import { ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import DepartmentManagement from "../components/DepartmentManagement";
import DoctorManagement from "../components/DoctorManagement";
import useAuthStore from "../store/authStore";

// Admin Paneli. Adım 2: Bölüm yönetimi · Adım 3: Doktor yönetimi.
// (Hatırlatma e-postaları sonraki adımda eklenecek.)
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

        <section className="mt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Bölüm Yönetimi
          </h2>
          <DepartmentManagement />
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Doktor Yönetimi
          </h2>
          <DoctorManagement />
        </section>
      </main>
    </div>
  );
}
