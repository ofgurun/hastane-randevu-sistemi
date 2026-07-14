import { useEffect, useState } from "react";
import { Loader2, XCircle, CalendarX2, CalendarClock, CheckCircle2, Star } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import ReviewModal from "../components/ReviewModal";
import { getMyAppointments, cancelAppointment } from "../services/appointmentService";

// ISO tarih → "GG.AA.YYYY" (yerel gün)
function formatDate(iso) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${m}.${d.getFullYear()}`;
}

// Randevunun tarih+saati geçmişte mi? (tamamlanmış/görüşülmüş sayılır)
function isPast(a) {
  const d = new Date(a.date);
  const [h, m] = a.timeSlot.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime() < Date.now();
}

// Erişim güvenliği App.jsx ProtectedRoute allowedRoles={["HASTA"]} ile merkezi (Gün 13).
export default function Appointments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [reviewedIds, setReviewedIds] = useState([]);
  const [reviewing, setReviewing] = useState(null); // değerlendirilen randevu

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const data = await getMyAppointments();
        if (active) setItems(data);
      } catch {
        if (active) {
          setLoadError(true);
          toast.error("Randevular yüklenemedi.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onCancel = async (id) => {
    setCancelingId(id);
    try {
      await cancelAppointment(id);
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: "IPTAL" } : a)));
      toast.success("Randevunuz iptal edildi.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Randevu iptal edilemedi.");
    } finally {
      setCancelingId(null);
    }
  };

  const markReviewed = (id) => setReviewedIds((prev) => [...prev, id]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Randevularım</h1>
        <p className="mt-1 text-slate-500">
          Aktif randevularınızı iptal edin, geçmiş randevularınızı değerlendirin.
        </p>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" /> Randevular yükleniyor…
          </div>
        )}

        {!loading && loadError && (
          <p className="py-20 text-center text-slate-500">Randevular yüklenemedi. Lütfen sayfayı yenileyin.</p>
        )}

        {!loading && !loadError && items.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <CalendarX2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">Henüz randevunuz yok.</p>
            <p className="mt-1 text-sm text-slate-400">Ana Sayfa'dan yeni bir randevu alabilirsiniz.</p>
          </div>
        )}

        {!loading && !loadError && items.length > 0 && (
          <ul className="mt-6 space-y-3">
            {items.map((a) => {
              const cancelled = a.status !== "AKTIF";
              const past = isPast(a);
              const reviewed = reviewedIds.includes(a.id);
              return (
                <li
                  key={a.id}
                  className={`flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                    cancelled ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {a.doctor?.user?.name}
                        <span className="mx-1.5 font-normal text-slate-300">·</span>
                        <span className="text-sm font-medium text-slate-500">{a.doctor?.department?.name}</span>
                      </p>
                      <p className="text-sm text-slate-500">{a.doctor?.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatDate(a.date)} — saat {a.timeSlot}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    {a.status === "AKTIF" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> AKTİF
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        <XCircle className="h-3.5 w-3.5" /> İPTAL
                      </span>
                    )}

                    {/* AKTİF randevu aksiyonları */}
                    {a.status === "AKTIF" && reviewed && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-500">
                        <Star className="h-4 w-4 fill-slate-400 text-slate-400" /> Değerlendirildi
                      </span>
                    )}

                    {a.status === "AKTIF" && !reviewed && past && (
                      <button
                        onClick={() => setReviewing(a)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <Star className="h-4 w-4" /> Değerlendir
                      </button>
                    )}

                    {a.status === "AKTIF" && !reviewed && !past && (
                      <button
                        onClick={() => onCancel(a.id)}
                        disabled={cancelingId === a.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cancelingId === a.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> İptal ediliyor…
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" /> İptal Et
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* Değerlendirme modalı */}
      {reviewing && (
        <ReviewModal
          appointment={reviewing}
          onClose={() => setReviewing(null)}
          onReviewed={markReviewed}
        />
      )}
    </div>
  );
}
