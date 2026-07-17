import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Lock, LockOpen } from "lucide-react";
import toast from "react-hot-toast";
import { getDoctorCalendar, toggleBlock } from "../services/scheduleService";
import { MONTHS, WEEK_HEADER, fmtLong, todayStr } from "../utils/ui";

// 16 sabit slot (backend ile aynı küme)
const ALL_SLOTS = [];
for (let m = 9 * 60; m < 17 * 60; m += 30) {
  ALL_SLOTS.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
}

// Doluluk barı: gün kapalı veya %71+ → kırmızı; %31-70 → turuncu; aksi yeşil.
function barColor(day) {
  if (day.dayClosed) return "bg-red-500";
  const occ = (day.appointmentCount / day.totalSlots) * 100;
  if (occ > 70) return "bg-red-500";
  if (occ > 30) return "bg-amber-500";
  return "bg-emerald-500";
}

// Admin — Takvim sekmesi: doktor seç → ay görünümü (doluluk barlı),
// güne tıkla → günü komple kapat/aç + saat saat toggle (TimeBlock).
export default function AdminCalendar({ doctors, initialDoctorId }) {
  const now = new Date();
  const [doctorId, setDoctorId] = useState(initialDoctorId || doctors[0]?.id || null);
  const [monthDate, setMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // seçili gün nesnesi
  const [busy, setBusy] = useState(null); // toggle bekleyen slot ("GÜN" veya "HH:mm")

  const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

  const load = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    setSelected(null);
    try {
      const data = await getDoctorCalendar(doctorId, monthStr);
      setDays(data.days);
    } catch {
      toast.error("Takvim yüklenemedi.");
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId, monthStr]);

  useEffect(() => {
    load();
  }, [load]);

  const shiftMonth = (delta) =>
    setMonthDate((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  // Toggle sonrası hem days hem selected state'ini güncelle
  const applyToggle = (dateStr, timeSlot, blocked) => {
    const patch = (d) => {
      if (d.date !== dateStr) return d;
      if (timeSlot === null || timeSlot === undefined) return { ...d, dayClosed: blocked };
      const blockedSlots = blocked
        ? [...d.blockedSlots, timeSlot]
        : d.blockedSlots.filter((s) => s !== timeSlot);
      return { ...d, blockedSlots };
    };
    setDays((prev) => prev.map(patch));
    setSelected((prev) => (prev && prev.date === dateStr ? patch(prev) : prev));
  };

  const onToggle = async (timeSlot) => {
    const key = timeSlot ?? "GÜN";
    setBusy(key);
    try {
      const res = await toggleBlock(doctorId, { date: selected.date, timeSlot });
      applyToggle(selected.date, timeSlot ?? null, res.blocked);
      toast.success(res.blocked ? "Kapatıldı." : "Açıldı.");
    } catch (err) {
      toast.error(err.response?.data?.message || "İşlem yapılamadı.");
    } finally {
      setBusy(null);
    }
  };

  const firstOffset =
    days.length > 0 ? (new Date(days[0].date + "T00:00:00").getDay() + 6) % 7 : 0;

  return (
    <div className="grid items-start gap-[22px] lg:grid-cols-[1.2fr_.8fr]">
      {/* Takvim */}
      <div className="rounded-[20px] border border-stone-200 bg-white px-6 py-[22px]">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
          <label className="block">
            <span className="block text-[11.5px] font-bold uppercase tracking-[.03em] text-stone-400">
              Doktor
            </span>
            <select
              value={doctorId ?? ""}
              onChange={(e) => {
                setDoctorId(Number(e.target.value));
                setSelected(null);
              }}
              className="mt-0.5 max-w-[320px] bg-transparent py-1 text-lg font-extrabold text-stone-800 outline-none"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} {d.user?.name} · {d.department?.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-stone-200 bg-stone-50 text-stone-600 transition hover:bg-stone-100"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="h-[18px] w-[18px]" />
            </button>
            <div className="min-w-[120px] text-center text-[15px] font-extrabold">
              {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
            </div>
            <button
              onClick={() => shiftMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-stone-200 bg-stone-50 text-stone-600 transition hover:bg-stone-100"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-stone-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Takvim yükleniyor…
          </div>
        ) : (
          <>
            <div className="mb-2 mt-4 grid grid-cols-7 gap-1.5">
              {WEEK_HEADER.map((w) => (
                <div key={w} className="text-center text-[11.5px] font-bold text-stone-400">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstOffset }).map((_, i) => (
                <div key={`e${i}`} className="h-[46px]" />
              ))}
              {days.map((d) => {
                const dayNum = Number(d.date.slice(-2));
                const sel = selected?.date === d.date;
                const isPast = d.date < todayStr(); // geçmiş günler pasif
                return (
                  <button
                    key={d.date}
                    disabled={isPast}
                    onClick={() => setSelected(d)}
                    title={isPast ? "Geçmiş tarih" : undefined}
                    className={`flex h-[46px] flex-col items-center justify-center rounded-[11px] border text-[13.5px] font-bold transition ${
                      sel
                        ? "border-teal-600 bg-teal-600 text-white"
                        : isPast
                          ? "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300"
                          : "border-stone-100 bg-white text-stone-800 hover:border-teal-300 hover:bg-teal-50"
                    }`}
                  >
                    <span>{dayNum}</span>
                    {!sel && !isPast && (
                      <span className={`mt-1 block h-1 w-[70%] rounded-[3px] ${barColor(d)}`} />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Renk açıklaması */}
            <div className="mt-4 flex flex-wrap gap-3.5 border-t border-stone-100 pt-3.5">
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-600">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-500" /> %0–30 dolu
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-600">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-amber-500" /> %31–70 dolu
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-600">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-red-500" /> %71+ dolu / gün kapalı
              </span>
            </div>
          </>
        )}
      </div>

      {/* Gün paneli */}
      <div className="min-h-[400px] rounded-[20px] border border-stone-200 bg-white px-6 py-[22px]">
        {!selected ? (
          <div className="flex h-[360px] flex-col items-center justify-center text-center text-stone-400">
            <div className="mb-1 text-[15px] font-bold text-stone-600">Bir gün seçin</div>
            <div className="max-w-[200px] text-[13px]">Takvimden gün seçerek saatleri yönetin.</div>
          </div>
        ) : (
          <>
            <div className="text-base font-extrabold">{fmtLong(selected.date)}</div>
            <div className="mb-4 mt-0.5 text-[12.5px] text-stone-500">
              {selected.appointmentCount} randevulu · {selected.blockedSlots.length} kapalı saat
              {selected.dayClosed && " · GÜN KAPALI"}
            </div>

            <button
              onClick={() => onToggle(null)}
              disabled={busy !== null}
              className={`flex h-11 w-full items-center justify-center gap-2 rounded-[11px] border text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected.dayClosed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              {busy === "GÜN" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : selected.dayClosed ? (
                <LockOpen className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {selected.dayClosed ? "Günü Tekrar Aç" : "Günü Komple Kapat"}
            </button>

            <div className="mb-2.5 mt-5 text-xs font-bold uppercase tracking-[.03em] text-stone-400">
              Saatler
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ALL_SLOTS.map((t) => {
                const booked = selected.bookedSlots.includes(t) && !selected.dayClosed;
                const blocked = selected.dayClosed || selected.blockedSlots.includes(t);
                let cls = "h-10 rounded-[10px] border text-[13px] font-bold transition ";
                if (booked) cls += "cursor-not-allowed border-blue-200 bg-blue-50 text-blue-700";
                else if (blocked) cls += "border-red-200 bg-red-50 text-red-600 hover:bg-red-100";
                else cls += "border-stone-200 bg-stone-50 text-stone-700 hover:border-emerald-300 hover:bg-emerald-50";
                if (selected.dayClosed) cls += " cursor-not-allowed opacity-60";
                return (
                  <button
                    key={t}
                    disabled={booked || selected.dayClosed || busy !== null}
                    onClick={() => onToggle(t)}
                    title={booked ? "Bu saatte randevu var" : blocked ? "Kapalı — açmak için tıkla" : "Açık — kapatmak için tıkla"}
                    className={cls}
                  >
                    {busy === t ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : t}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3.5 border-t border-stone-100 pt-3.5">
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-600">
                <span className="h-2.5 w-2.5 rounded-[3px] border border-blue-200 bg-blue-50" /> Randevulu (kilitli)
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-600">
                <span className="h-2.5 w-2.5 rounded-[3px] border border-red-200 bg-red-50" /> Kapalı
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-600">
                <span className="h-2.5 w-2.5 rounded-[3px] border border-stone-200 bg-stone-50" /> Açık
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
