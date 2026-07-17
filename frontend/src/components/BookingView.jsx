import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Clock, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { getAvailableSlots, createAppointment } from "../services/appointmentService";
import { getDoctorAvailability } from "../services/doctorService";
import { MONTHS, WEEK_HEADER, initials, todayStr, fmtLong, fmtShort } from "../utils/ui";

// 16 sabit slot (09:00–16:30, backend ile aynı küme)
const ALL_SLOTS = [];
for (let m = 9 * 60; m < 17 * 60; m += 30) {
  ALL_SLOTS.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
}

// Doluluk noktası: kapalı/dolu → kırmızı; %31-70 → turuncu; aksi yeşil.
function dotColor(day) {
  if (day.dayClosed || day.availableCount === 0) return "bg-red-500";
  const occ = ((day.totalSlots - day.availableCount) / day.totalSlots) * 100;
  if (occ > 70) return "bg-red-500";
  if (occ > 30) return "bg-amber-500";
  return "bg-emerald-500";
}

// Hasta randevu alma ekranı: solda doluluk noktali ay takvimi, sağda boş saatler.
// Saat seçince onay modalı → randevu oluşturulur → Randevularım'a gidilir.
export default function BookingView({ doctor, onBack }) {
  const navigate = useNavigate();
  const now = new Date();
  const today = todayStr();

  const [monthDate, setMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [days, setDays] = useState([]);
  const [calLoading, setCalLoading] = useState(true);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]); // API'den gelen BOŞ saatler
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pendingSlot, setPendingSlot] = useState(null); // onay bekleyen saat
  const [booking, setBooking] = useState(false);

  const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
  const atCurrentMonth =
    monthDate.getFullYear() === now.getFullYear() && monthDate.getMonth() === now.getMonth();

  const loadCalendar = useCallback(async () => {
    setCalLoading(true);
    try {
      const data = await getDoctorAvailability(doctor.id, monthStr);
      setDays(data.days);
    } catch {
      toast.error("Doluluk takvimi yüklenemedi.");
      setDays([]);
    } finally {
      setCalLoading(false);
    }
  }, [doctor.id, monthStr]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const shiftMonth = (delta) => {
    setDate(null);
    setSlots([]);
    setMonthDate((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };

  const selectDay = async (ds) => {
    setDate(ds);
    setSlots([]);
    setSlotsLoading(true);
    try {
      const data = await getAvailableSlots(doctor.id, ds);
      setSlots(data);
    } catch {
      toast.error("Uygun saatler yüklenemedi.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const confirmBooking = async () => {
    setBooking(true);
    try {
      await createAppointment(doctor.id, date, pendingSlot);
      toast.success(`Randevu oluşturuldu: ${fmtShort(date)} · ${pendingSlot}`);
      setPendingSlot(null);
      navigate("/appointments");
    } catch (err) {
      toast.error(err.response?.data?.message || "Randevu oluşturulamadı.");
      setPendingSlot(null);
      // Çakışma olduysa güncel durumu tazele
      selectDay(date);
      loadCalendar();
    } finally {
      setBooking(false);
    }
  };

  const firstOffset =
    days.length > 0 ? (new Date(days[0].date + "T00:00:00").getDay() + 6) % 7 : 0;
  const freeSet = new Set(slots);

  return (
    <div className="mx-auto max-w-[1100px] animate-fadeUp px-6 pb-16 pt-7">
      <button
        onClick={onBack}
        className="mb-[18px] inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-stone-500 transition hover:text-stone-700"
      >
        <ChevronLeft className="h-[17px] w-[17px]" /> Doktorlara dön
      </button>

      {/* Doktor başlığı */}
      <div className="mb-[26px] flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-lg font-extrabold text-teal-700">
          {initials(doctor.user?.name)}
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-teal-600">{doctor.title}</div>
          <h1 className="text-[23px] font-extrabold tracking-tight text-stone-800">{doctor.user?.name}</h1>
          <div className="text-[13.5px] text-stone-500">{doctor.department?.name}</div>
        </div>
      </div>

      <div className="grid items-start gap-[22px] lg:grid-cols-[1.15fr_.85fr]">
        {/* Takvim */}
        <div className="rounded-[20px] border border-stone-200 bg-white px-6 py-[22px]">
          <div className="mb-[18px] flex items-center justify-between">
            <button
              onClick={() => shiftMonth(-1)}
              disabled={atCurrentMonth}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-stone-200 bg-stone-50 text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-300"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="h-[18px] w-[18px]" />
            </button>
            <div className="text-[17px] font-extrabold tracking-tight">
              {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
            </div>
            <button
              onClick={() => shiftMonth(1)}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-stone-200 bg-stone-50 text-stone-600 transition hover:bg-stone-100"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="h-[18px] w-[18px]" />
            </button>
          </div>

          {calLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Takvim yükleniyor…
            </div>
          ) : (
            <>
              <div className="mb-2 grid grid-cols-7 gap-1.5">
                {WEEK_HEADER.map((w) => (
                  <div key={w} className="py-1 text-center text-[11.5px] font-bold text-stone-400">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstOffset }).map((_, i) => (
                  <div key={`e${i}`} className="h-11" />
                ))}
                {days.map((d) => {
                  const dayNum = Number(d.date.slice(-2));
                  const isPast = d.date < today;
                  const closed = d.dayClosed || d.availableCount === 0;
                  const disabled = isPast || closed;
                  const sel = date === d.date;
                  let cls =
                    "flex h-11 flex-col items-center justify-center rounded-[11px] border text-[13.5px] font-bold transition ";
                  if (sel) cls += "border-teal-600 bg-teal-600 text-white";
                  else if (isPast) cls += "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300";
                  else if (closed) cls += "cursor-not-allowed border-red-100 bg-red-50 text-red-600";
                  else cls += "border-stone-100 bg-white text-stone-800 hover:border-teal-300 hover:bg-teal-50";
                  return (
                    <button
                      key={d.date}
                      disabled={disabled}
                      onClick={() => selectDay(d.date)}
                      title={
                        isPast
                          ? "Geçmiş tarih"
                          : d.dayClosed
                            ? "Bu gün randevuya kapalı"
                            : d.availableCount === 0
                              ? "Bu gün tamamen dolu"
                              : `${d.availableCount} boş saat`
                      }
                      className={cls}
                    >
                      <span>{dayNum}</span>
                      {!isPast && !sel && (
                        <span className={`mt-[3px] block h-[5px] w-[5px] rounded-full ${dotColor(d)}`} />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Renk açıklaması */}
              <div className="mt-[18px] flex flex-wrap gap-4 border-t border-stone-100 pt-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Uygun
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Kısmen dolu
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Dolu / Kapalı
                </span>
              </div>
            </>
          )}
        </div>

        {/* Saatler */}
        <div className="min-h-[360px] rounded-[20px] border border-stone-200 bg-white px-6 py-[22px]">
          {!date ? (
            <div className="flex h-[320px] flex-col items-center justify-center text-center text-stone-400">
              <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
                <Clock className="h-[26px] w-[26px] text-stone-400" />
              </div>
              <div className="mb-1 text-[15px] font-bold text-stone-600">Bir gün seçin</div>
              <div className="max-w-[200px] text-[13px]">
                Takvimden uygun bir gün seçerek boş saatleri görüntüleyin.
              </div>
            </div>
          ) : (
            <>
              <div className="mb-0.5 text-[15.5px] font-extrabold">{fmtLong(date)}</div>
              <div className="mb-4 text-[13px] text-stone-500">
                {slotsLoading ? "Saatler yükleniyor…" : `${slots.length} boş saat`}
              </div>

              {slotsLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-stone-500">
                  <Loader2 className="h-5 w-5 animate-spin" /> Saatler yükleniyor…
                </div>
              ) : slots.length === 0 ? (
                <div className="px-2.5 py-10 text-center text-stone-400">
                  <div className="mb-1 text-sm font-bold text-stone-600">Boş saat kalmadı</div>
                  <div className="text-[13px]">Lütfen başka bir gün seçin.</div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {ALL_SLOTS.map((t) => {
                    const free = freeSet.has(t);
                    return (
                      <button
                        key={t}
                        disabled={!free}
                        onClick={() => setPendingSlot(t)}
                        className={
                          free
                            ? "h-[42px] rounded-[10px] border border-teal-100 bg-teal-50 text-[13.5px] font-bold text-teal-700 transition hover:bg-teal-100"
                            : "h-[42px] cursor-not-allowed rounded-[10px] border border-stone-100 bg-stone-50 text-[13.5px] font-semibold text-stone-300 line-through"
                        }
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Randevu onay modalı */}
      {pendingSlot && (
        <Modal onClose={() => !booking && setPendingSlot(null)} maxWidth="max-w-[420px]">
          <div className="p-7">
            <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[15px] bg-teal-50">
              <CalendarDays className="h-[26px] w-[26px] text-teal-600" />
            </div>
            <h3 className="mb-1.5 text-xl font-extrabold">Randevunuzu onaylayın</h3>
            <p className="mb-5 text-sm text-stone-500">Aşağıdaki bilgilerle randevu oluşturulacak.</p>
            <div className="mb-[22px] flex flex-col gap-3 rounded-[14px] border border-stone-200 bg-stone-50 px-[18px] py-4">
              <div className="flex justify-between">
                <span className="text-[13px] text-stone-500">Doktor</span>
                <span className="text-[13.5px] font-bold">{doctor.title} {doctor.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-stone-500">Bölüm</span>
                <span className="text-[13.5px] font-bold">{doctor.department?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-stone-500">Tarih</span>
                <span className="text-[13.5px] font-bold">{fmtLong(date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-stone-500">Saat</span>
                <span className="text-[13.5px] font-bold text-teal-600">{pendingSlot}</span>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setPendingSlot(null)}
                disabled={booking}
                className="h-[46px] flex-1 rounded-[11px] border border-stone-200 bg-white text-sm font-bold text-stone-600 transition hover:bg-stone-50 disabled:opacity-60"
              >
                Vazgeç
              </button>
              <button
                onClick={confirmBooking}
                disabled={booking}
                className="flex h-[46px] flex-[1.4] items-center justify-center gap-2 rounded-[11px] bg-teal-600 text-sm font-bold text-white shadow-[0_6px_16px_rgba(13,148,136,.28)] transition hover:bg-teal-700 disabled:opacity-60"
              >
                {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Randevuyu Oluştur
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
