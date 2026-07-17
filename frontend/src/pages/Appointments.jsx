import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CalendarX2, Star, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import ReviewModal from "../components/ReviewModal";
import StatusBadge from "../components/StatusBadge";
import { getMyAppointments, cancelAppointment } from "../services/appointmentService";
import { MONTHS_ABBR, fmtLong, apptStart } from "../utils/ui";

// Duruma göre tarih karosu renkleri
function dateTileCls(status) {
  if (status === "TAMAMLANDI") return "bg-emerald-50 border-emerald-100 text-emerald-700";
  if (status === "IPTAL") return "bg-stone-100 border-stone-200 text-stone-400";
  return "bg-blue-50 border-blue-100 text-blue-700";
}

// Erişim güvenliği App.jsx ProtectedRoute allowedRoles={["HASTA"]} ile merkezi.
export default function Appointments() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null); // onay bekleyen randevu
  const [cancelling, setCancelling] = useState(false);
  const [reviewing, setReviewing] = useState(null); // değerlendirilen randevu

  const load = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const data = await getMyAppointments();
      setItems(data);
    } catch {
      setLoadError(true);
      toast.error("Randevular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doCancel = async () => {
    setCancelling(true);
    try {
      await cancelAppointment(cancelTarget.id);
      setItems((prev) => prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: "IPTAL" } : a)));
      toast.success("Randevunuz iptal edildi.");
      setCancelTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Randevu iptal edilemedi.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <Navbar />

      <main className="mx-auto max-w-[900px] animate-fadeUp px-6 pb-16 pt-8">
        <h1 className="mb-1 text-[26px] font-extrabold tracking-tight">Randevularım</h1>
        <p className="mb-[26px] text-[14.5px] text-stone-500">Geçmiş ve gelecek tüm randevularınız.</p>

        {loading && (
          <div className="flex flex-col gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-[18px] border border-stone-200 bg-white" />
            ))}
          </div>
        )}

        {!loading && loadError && (
          <div className="rounded-[18px] border border-stone-200 bg-white px-5 py-[52px] text-center">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-[26px] w-[26px] text-red-600" />
            </div>
            <div className="mb-1 text-base font-bold">Randevular yüklenemedi</div>
            <div className="mb-[18px] text-sm text-stone-500">Bir hata oluştu.</div>
            <button
              onClick={load}
              className="h-[42px] rounded-[10px] bg-teal-600 px-[22px] text-sm font-bold text-white transition hover:bg-teal-700"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {!loading && !loadError && items.length === 0 && (
          <div className="rounded-[18px] border border-stone-200 bg-white px-5 py-14 text-center">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
              <CalendarX2 className="h-[26px] w-[26px] text-teal-600" />
            </div>
            <div className="mb-1 text-base font-bold">Henüz randevunuz yok</div>
            <div className="mb-[18px] text-sm text-stone-500">Bir bölüm seçerek ilk randevunuzu oluşturun.</div>
            <button
              onClick={() => navigate("/")}
              className="h-11 rounded-[11px] bg-teal-600 px-[22px] text-sm font-bold text-white shadow-[0_5px_14px_rgba(13,148,136,.24)] transition hover:bg-teal-700"
            >
              Randevu Al
            </button>
          </div>
        )}

        {!loading && !loadError && items.length > 0 && (
          <div className="flex flex-col gap-3.5">
            {items.map((a) => {
              const d = new Date(a.date);
              const cancelled = a.status === "IPTAL";
              const past = apptStart(a).getTime() < Date.now();
              const reviewed = !!a.review;
              const canCancel = a.status === "AKTIF" && !past;
              const canReview =
                !cancelled && !reviewed && ((a.status === "AKTIF" && past) || a.status === "TAMAMLANDI");
              return (
                <div
                  key={a.id}
                  className={`rounded-[18px] border border-stone-200 bg-white px-5 py-[18px] ${cancelled ? "opacity-70" : ""}`}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    {/* Tarih karosu */}
                    <div className={`min-w-[66px] rounded-[14px] border px-3.5 py-2.5 text-center ${dateTileCls(a.status)}`}>
                      <div className="text-[22px] font-extrabold leading-none">{d.getDate()}</div>
                      <div className="mt-0.5 text-[11.5px] font-bold uppercase">{MONTHS_ABBR[d.getMonth()]}</div>
                    </div>

                    <div className="min-w-[180px] flex-1">
                      <div className="mb-[5px] flex flex-wrap items-center gap-2">
                        <StatusBadge status={a.status} />
                        {reviewed && (
                          <span className="rounded-[20px] border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-600">
                            ★ Değerlendirildi
                          </span>
                        )}
                      </div>
                      <div className="text-base font-bold tracking-tight">{a.doctor?.user?.name}</div>
                      <div className="mt-0.5 text-[13px] text-stone-500">
                        {a.doctor?.department?.name} · {a.timeSlot} · {fmtLong(a.date)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canReview && (
                        <button
                          onClick={() => setReviewing(a)}
                          className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-amber-200 bg-amber-50 px-4 text-[13.5px] font-bold text-amber-700 transition hover:bg-amber-100"
                        >
                          <Star className="h-4 w-4" /> Değerlendir
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => setCancelTarget(a)}
                          className="h-10 rounded-[10px] border border-red-200 bg-white px-4 text-[13.5px] font-bold text-red-600 transition hover:bg-red-50"
                        >
                          İptal Et
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* İptal onay modalı */}
      {cancelTarget && (
        <Modal onClose={() => !cancelling && setCancelTarget(null)} maxWidth="max-w-[420px]">
          <div className="p-7">
            <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[15px] bg-red-50">
              <AlertTriangle className="h-[26px] w-[26px] text-red-600" />
            </div>
            <h3 className="mb-1.5 text-xl font-extrabold">Randevuyu iptal et</h3>
            <p className="mb-[22px] text-sm leading-relaxed text-stone-500">
              Bu randevuyu iptal etmek istediğinize emin misiniz? İptal edilen randevu geri alınamaz.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="h-[46px] flex-1 rounded-[11px] border border-stone-200 bg-white text-sm font-bold text-stone-600 transition hover:bg-stone-50 disabled:opacity-60"
              >
                Vazgeç
              </button>
              <button
                onClick={doCancel}
                disabled={cancelling}
                className="flex h-[46px] flex-[1.2] items-center justify-center gap-2 rounded-[11px] bg-red-600 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Evet, İptal Et
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Değerlendirme modalı */}
      {reviewing && (
        <ReviewModal
          appointment={reviewing}
          onClose={() => setReviewing(null)}
          onReviewed={(id) => setItems((prev) => prev.map((a) => a.id === id ? { ...a, review: { id: -1 } } : a))}
        />
      )}
    </div>
  );
}
