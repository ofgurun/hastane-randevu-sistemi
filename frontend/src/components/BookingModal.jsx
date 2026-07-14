import { useState } from "react";
import { X, Loader2, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import { getAvailableSlots, createAppointment } from "../services/appointmentService";

// Bugünün tarihini "YYYY-MM-DD" (yerel) döndürür — date input'un min'i için.
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Seçili doktor için randevu alma modalı: tarih seç → boş slotlar → slota tıkla → randevu.
// Bildirimler toast ile; başarıda modal kapanır.
export default function BookingModal({ doctor, onClose }) {
  const today = todayStr();

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(null); // alınmakta olan slot ("HH:mm")

  const onDateChange = async (e) => {
    const value = e.target.value;
    setDate(value);
    setSlots([]);
    if (!value) return;

    setSlotsLoading(true);
    try {
      const data = await getAvailableSlots(doctor.id, value);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Randevu Al</p>
            <h2 className="text-lg font-bold text-slate-900">{doctor.user?.name}</h2>
            <p className="text-sm text-slate-500">{doctor.title}</p>
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
        <div className="space-y-4 px-6 py-5">
          {/* Tarih seçici */}
          <div>
            <label htmlFor="booking-date" className="mb-1.5 block text-sm font-medium text-slate-700">
              Tarih seçin
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="booking-date"
                type="date"
                min={today}
                value={date}
                onChange={onDateChange}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Slotlar */}
          {date && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Uygun saatler</p>

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
