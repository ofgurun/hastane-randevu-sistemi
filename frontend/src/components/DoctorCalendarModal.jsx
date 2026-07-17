import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Loader2, Lock, LockOpen } from "lucide-react";
import toast from "react-hot-toast";
import { getDoctorCalendar, toggleBlock } from "../services/scheduleService";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// Doluluk rengi: gün kapalıysa veya %71+ → kırmızı; %31-70 → turuncu; aksi yeşil.
function fillColor(day) {
  if (day.dayClosed) return "bg-red-500";
  const pct = (day.appointmentCount / day.totalSlots) * 100;
  if (pct > 70) return "bg-red-500";
  if (pct > 30) return "bg-orange-400";
  return "bg-green-500";
}

// Admin — doktor takvimi: ay görünümü + gün/saat kapatma-açma (TimeBlock toggle).
export default function DoctorCalendarModal({ doctor, onClose }) {
  const now = new Date();
  const [monthDate, setMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // seçili gün nesnesi
  const [busy, setBusy] = useState(null); // toggle bekleyen slot ("GÜN" veya "HH:mm")

  const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    try {
      const data = await getDoctorCalendar(doctor.id, monthStr);
      setDays(data.days);
    } catch {
      toast.error("Takvim yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [doctor.id, monthStr]);

  useEffect(() => {
    load();
  }, [load]);

  const shiftMonth = (delta) =>
    setMonthDate((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  // Toggle sonrası hem days hem selected state'ini güncelle
  const applyToggle = (dateStr, timeSlot, blocked) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.date !== dateStr) return d;
        if (timeSlot === null || timeSlot === undefined) {
          return { ...d, dayClosed: blocked };
        }
        const blockedSlots = blocked
          ? [...d.blockedSlots, timeSlot]
          : d.blockedSlots.filter((s) => s !== timeSlot);
        return { ...d, blockedSlots };
      })
    );
    setSelected((prev) => {
      if (!prev || prev.date !== dateStr) return prev;
      if (timeSlot === null || timeSlot === undefined) return { ...prev, dayClosed: blocked };
      const blockedSlots = blocked
        ? [...prev.blockedSlots, timeSlot]
        : prev.blockedSlots.filter((s) => s !== timeSlot);
      return { ...prev, blockedSlots };
    });
  };

  const onToggle = async (timeSlot) => {
    const key = timeSlot ?? "GÜN";
    setBusy(key);
    try {
      const res = await toggleBlock(doctor.id, { date: selected.date, timeSlot });
      applyToggle(selected.date, timeSlot ?? null, res.blocked);
      toast.success(res.blocked ? "Kapatıldı." : "Açıldı.");
    } catch (err) {
      toast.error(err.response?.data?.message || "İşlem yapılamadı.");
    } finally {
      setBusy(null);
    }
  };

  // Takvim grid'i: haftanın Pazartesi'den başlaması için offset
  const firstOffset = days.length > 0 ? (new Date(days[0].date + "T00:00:00").getDay() + 6) % 7 : 0;

  // 30 dk slot listesi (görsel için sabit; backend ile aynı küme)
  const ALL_SLOTS = [];
  for (let m = 9 * 60; m < 17 * 60; m += 30) {
    ALL_SLOTS.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Takvim / Saatler</p>
            <h2 className="text-lg font-bold text-slate-900">{doctor.user?.name}</h2>
            <p className="text-sm text-slate-500">{doctor.title} · {doctor.department?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {/* Ay gezinme */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => shiftMonth(-1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="font-semibold text-slate-900">
              {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
            </p>
            <button
              onClick={() => shiftMonth(1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Takvim yükleniyor…
            </div>
          ) : (
            <>
              {/* Hafta başlıkları */}
              <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-slate-400">
                {WEEKDAYS.map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>

              {/* Gün grid'i */}
              <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((d) => {
                  const dayNum = Number(d.date.slice(-2));
                  const isSelected = selected?.date === d.date;
                  return (
                    <button
                      key={d.date}
                      onClick={() => setSelected(d)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-sm transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 font-semibold text-blue-700"
                          : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>{dayNum}</span>
                      <span className={`h-1.5 w-full rounded-full ${fillColor(d)}`} />
                    </button>
                  );
                })}
              </div>

              {/* Renk açıklaması */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-green-500" /> %0–30 dolu</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-orange-400" /> %31–70 dolu</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-red-500" /> %71+ dolu / gün kapalı</span>
              </div>

              {/* Seçili gün detayı */}
              {selected && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {Number(selected.date.slice(-2))} {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selected.appointmentCount} randevu · {selected.blockedSlots.length} kapalı saat
                        {selected.dayClosed && " · GÜN KAPALI"}
                      </p>
                    </div>
                    <button
                      onClick={() => onToggle(null)}
                      disabled={busy !== null}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected.dayClosed ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {busy === "GÜN" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : selected.dayClosed ? (
                        <LockOpen className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      {selected.dayClosed ? "Günü Aç" : "Günü Komple Kapat"}
                    </button>
                  </div>

                  {/* Saat toggle'ları */}
                  {!selected.dayClosed && (
                    <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
                      {ALL_SLOTS.map((s) => {
                        const isBooked = selected.bookedSlots.includes(s);
                        const isBlocked = selected.blockedSlots.includes(s);
                        return (
                          <button
                            key={s}
                            disabled={isBooked || busy !== null}
                            onClick={() => onToggle(s)}
                            title={isBooked ? "Bu saatte randevu var" : isBlocked ? "Kapalı — açmak için tıkla" : "Açık — kapatmak için tıkla"}
                            className={`rounded-lg border py-2 text-xs font-medium transition disabled:cursor-not-allowed ${
                              isBooked
                                ? "border-blue-200 bg-blue-100 text-blue-700 opacity-80"
                                : isBlocked
                                  ? "border-red-300 bg-red-50 text-red-600 line-through hover:bg-red-100"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-green-400 hover:bg-green-50"
                            }`}
                          >
                            {busy === s ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : s}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-slate-400">
                    Mavi: randevulu (değiştirilemez) · Kırmızı üstü çizili: kapalı · Beyaz: açık. Saate tıklayarak kapat/aç.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
