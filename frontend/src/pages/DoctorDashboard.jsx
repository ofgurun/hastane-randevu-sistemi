import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, CalendarX2, Clock, User, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import { getDoctorAppointments } from "../services/appointmentService";

// ISO tarih → "GG.AA.YYYY" (yerel gün)
function formatDate(iso) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${m}.${d.getFullYear()}`;
}

// Doktor Paneli — kendi randevu ajandası (yalnızca görüntüleme / read-only).
export default function DoctorDashboard() {
  const { user, isAuthenticated } = useAuthStore();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const data = await getDoctorAppointments();
        if (active) setItems(data);
      } catch {
        if (active) {
          setLoadError(true);
          toast.error("Ajanda yüklenemedi.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Erişim güvenliği: giriş yoksa /login, doktor değilse ana sayfaya.
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "DOKTOR") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Ajandam</h1>
        <p className="mt-1 text-slate-500">Size atanmış randevular (yalnızca görüntüleme).</p>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" /> Ajanda yükleniyor…
          </div>
        )}

        {!loading && loadError && (
          <p className="py-20 text-center text-slate-500">Ajanda yüklenemedi. Lütfen sayfayı yenileyin.</p>
        )}

        {!loading && !loadError && items.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <CalendarX2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">Henüz randevunuz yok.</p>
            <p className="mt-1 text-sm text-slate-400">Size randevu alındığında burada listelenecek.</p>
          </div>
        )}

        {!loading && !loadError && items.length > 0 && (
          <ul className="mt-6 space-y-3">
            {items.map((a) => {
              const cancelled = a.status !== "AKTIF";
              return (
                <li
                  key={a.id}
                  className={`flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                    cancelled ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{a.patient?.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {formatDate(a.date)} — saat {a.timeSlot}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    {a.status === "AKTIF" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> AKTİF
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        <XCircle className="h-3.5 w-3.5" /> İPTAL
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
