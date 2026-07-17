import { useCallback, useEffect, useState } from "react";
import { X, Loader2, ChevronLeft, ChevronRight, Star } from "lucide-react";
import toast from "react-hot-toast";
import { getAvailableSlots, createAppointment } from "../services/appointmentService";
import { getDoctorAvailability } from "../services/doctorService";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// Bugünün tarihini "YYYY-MM-DD" (yerel) döndürür — geçmiş günleri kilitlemek için.
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Doluluk rengi (admin takvimiyle aynı eşikler): gün kapalı veya hiç boş slot yoksa
// ya da %71+ doluysa kırmızı; %31-70 turuncu; aksi yeşil.
function fillColor(day) {
  if (day.dayClosed || day.availableCount === 0) return "bg-red-500";
  const pct = ((day.totalSlots - day.availableCount) / day.totalSlots) * 100;
  if (pct > 70) return "bg-red-500";
  if (pct > 30) return "bg-orange-400";
  return "bg-green-500";
}

// Seçili doktor için randevu alma modalı: takvimden gün seç (doluluk renk barlı) →
// boş slotlar → slota tıkla → randevu. Bildirimler toast ile; başarıda modal kapanır.
export default function BookingModal({ doctor, onClose }) {
  const today = todayStr();
  const now = new Date();

  const [monthDate, setMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [days, setDays] = useState([]);
  const [calLoading, setCalLoading] = useState(true);

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(null); // alınmakta olan slot ("HH:mm")

  const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
  // Geçmiş aya gezinmeyi engelle
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
    setDate("");
    setSlots([]);
    setMonthDate((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };

  const selectDay = async (day) => {
    setDate(day.date);
    setSlots([]);
    setSlotsLoading(true);
    try {
      const data = await getAvailableSlots(doctor.id, day.date);
      setSlots(data);
    } catch {
      toast.error("Uygun saatler yüklenemedi.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const book = async (slot) => {
    setBooking(slot);
    try {
      await createAppointment(doctor.id, date, slot);
      toast.success(`Randevunuz oluşturuldu: ${date} — saat ${slot}`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Randevu oluşturulamadı.");
    } finally {
      setBooking(null);
    }
  };

  // Takvim grid'i: haftanın Pazartesi'den başlaması için offset
  const firstOffset =
    days.length > 0 ? (new Date(days[0].date + "T00:00:00").getDay() + 6) % 7 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Randevu Al</p>
            <h2 className="text-lg font-bold text-slate-900">{doctor.user?.name}</h2>
            <p className="text-sm text-slate-500">{doctor.title}</p>
            {doctor.reviewCount > 0 && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-600">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{doctor.averageRating}</span>
                <span className="text-slate-400">/ 5 · {doctor.reviewCount} Değerlendirme</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Gövde */}
        <div className="space-y-4 overflow-y-auto px-6 py-5">
          {/* Ay gezinme */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => shiftMonth(-1)}
              disabled={atCurrentMonth}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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

          {calLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Takvim yükleniyor…
            </div>
          ) : (
            <>
              {/* Hafta başlıkları */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-slate-400">
                {WEEKDAYS.map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>

              {/* Gün grid'i */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((d) => {
                  const dayNum = Number(d.date.slice(-2));
                  const isPast = d.date < today;
                  const unavailable = d.dayClosed || d.availableCount === 0;
                  const disabled = isPast || unavailable;
                  const isSelected = date === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDay(d)}
                      title={
                        isPast
                          ? "Geçmiş tarih"
                          : d.dayClosed
                            ? "Bu gün randevuya kapalı"
                            : d.availableCount === 0
                              ? "Bu gün tamamen dolu"
                              : `${d.availableCount} boş saat`
                      }
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-sm transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 font-semibold text-blue-700"
                          : disabled
                            ? "cursor-not-allowed border-slate-100 text-slate-300"
                            : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>{dayNum}</span>
                      <span
                        className={`h-1.5 w-full rounded-full ${
                          isPast ? "bg-slate-200" : fillColor(d)
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Renk açıklaması */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-green-500" /> Müsait</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-orange-400" /> Orta doluluk</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-red-500" /> Dolu / kapalı</span>
              </div>
            </>
          )}

          {/* Slotlar */}
          {date && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                {Number(date.slice(-2))} {MONTHS[monthDate.getMonth()]} — uygun saatler
              </p>

              {slotsLoading && (
                <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" /> Saatler yükleniyor…
                </div>
              )}

              {!slotsLoading && slots.length === 0 && (
                <p className="py-8 text-center text-slate-500">Bu tarih için uygun saat bulunmuyor.</p>
              )}

              {!slotsLoading && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={booking !== null}
                      onClick={() => book(s)}
                      className="flex items-center justify-center rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {booking === s ? <Loader2 className="h-4 w-4 animate-spin" /> : s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
