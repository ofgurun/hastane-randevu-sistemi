import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Clock, CalendarClock } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { getAvailableSlots, rescheduleAppointment } from "../services/appointmentService";
import { getDoctorAvailability } from "../services/doctorService";
import { MONTHS, WEEK_HEADER, todayStr, fmtLong, fmtShort } from "../utils/ui";

// 16 sabit slot (09:00–16:30)
const ALL_SLOTS = [];
for (let m = 9 * 60; m < 17 * 60; m += 30) {
  ALL_SLOTS.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
}

function dotColor(day) {
  if (day.dayClosed || day.availableCount === 0) return "bg-red-500";
  const occ = ((day.totalSlots - day.availableCount) / day.totalSlots) * 100;
  if (occ > 70) return "bg-red-500";
  if (occ > 30) return "bg-amber-500";
  return "bg-emerald-500";
}

// Randevu erteleme modalı — aynı doktorla yeni tarih/saat seçilir (iptal + yeniden alma gerekmez).
export default function RescheduleModal({ appointment, onClose, onRescheduled }) {
  const doctor = appointment.doctor;
  const now = new Date();
  const today = todayStr();

  const [monthDate, setMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [days, setDays] = useState([]);
  const [calLoading, setCalLoading] = useState(true);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pendingSlot, setPendingSlot] = useState(null);
  const [saving, setSaving] = useState(false);

  const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
  const atCurrentMonth = monthDate.getFullYear() === now.getFullYear() && monthDate.getMonth() === now.getMonth();

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
    setPendingSlot(null);
    setMonthDate((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };

  const selectDay = async (ds) => {
    setDate(ds);
    setSlots([]);
    setPendingSlot(null);
    setSlotsLoading(true);
    try {
      setSlots(await getAvailableSlots(doctor.id, ds));
    } catch {
      toast.error("Uygun saatler yüklenemedi.");
    } finally {
      setSlotsLoading(false);
    }
  };

  const confirm = async () => {
    setSaving(true);
    try {
      const updated = await rescheduleAppointment(appointment.id, date, pendingSlot);
      toast.success(`Randevu ertelendi: ${fmtShort(date)} · ${pendingSlot}`);
      onRescheduled(updated);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Randevu ertelenemedi.");
      selectDay(date);
      loadCalendar();
    } finally {
      setSaving(false);
    }
  };

  const firstOffset = days.length > 0 ? (new Date(days[0].date + "T00:00:00").getDay() + 6) % 7 : 0;
  const freeSet = new Set(slots);

  return (
    <Modal onClose={() => !saving && onClose()} maxWidth="max-w-[760px]">
      <div className="p-6 sm:p-7">
        <div className="mb-1 flex items-center gap-2.5">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-teal-50">
            <CalendarClock className="h-[24px] w-[24px] text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold tracking-tight">Randevuyu Ertele</h3>
            <div className="text-[13px] text-stone-500">
              {doctor.title} {doctor.user?.name} · {doctor.department?.name}
            </div>
          </div>
        </div>

        {/* Mevcut randevu */}
        <div className="mb-4 mt-3 rounded-[12px] border border-stone-200 bg-stone-50 px-4 py-2.5 text-[13px]">
          <span className="text-stone-500">Mevcut randevu:</span>{" "}
          <span className="font-bold text-stone-700">{fmtLong(appointment.date)} · {appointment.timeSlot}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.1fr_.9fr]">
          {/* Takvim */}
          <div className="rounded-[16px] border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => shiftMonth(-1)}
                disabled={atCurrentMonth}
                className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-stone-200 bg-stone-50 text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-300"
                aria-label="Önceki ay"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-[14.5px] font-extrabold tracking-tight">
                {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
              </div>
              <button
                onClick={() => shiftMonth(1)}
                className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-stone-200 bg-stone-50 text-stone-600 transition hover:bg-stone-100"
                aria-label="Sonraki ay"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {calLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-stone-500">
                <Loader2 className="h-5 w-5 animate-spin" /> Yükleniyor…
              </div>
            ) : (
              <>
                <div className="mb-1.5 grid grid-cols-7 gap-1">
                  {WEEK_HEADER.map((w) => (
                    <div key={w} className="py-0.5 text-center text-[10.5px] font-bold text-stone-400">{w}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstOffset }).map((_, i) => <div key={`e${i}`} className="h-9" />)}
                  {days.map((dd) => {
                    const dayNum = Number(dd.date.slice(-2));
                    const isPast = dd.date < today;
                    const closed = dd.dayClosed || dd.availableCount === 0;
                    const disabled = isPast || closed;
                    const sel = date === dd.date;
                    let cls = "flex h-9 flex-col items-center justify-center rounded-[9px] border text-[12.5px] font-bold transition ";
                    if (sel) cls += "border-teal-600 bg-teal-600 text-white";
                    else if (isPast) cls += "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300";
                    else if (closed) cls += "cursor-not-allowed border-red-100 bg-red-50 text-red-500";
                    else cls += "border-stone-100 bg-white text-stone-800 hover:border-teal-300 hover:bg-teal-50";
                    return (
                      <button key={dd.date} disabled={disabled} onClick={() => selectDay(dd.date)} className={cls}>
                        <span>{dayNum}</span>
                        {!isPast && !sel && <span className={`mt-px block h-1 w-1 rounded-full ${dotColor(dd)}`} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Saatler */}
          <div className="rounded-[16px] border border-stone-200 bg-white p-4">
            {!date ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-stone-400">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
                  <Clock className="h-6 w-6 text-stone-400" />
                </div>
                <div className="text-[13.5px] font-bold text-stone-600">Bir gün seçin</div>
                <div className="mt-1 max-w-[180px] text-[12px]">Takvimden gün seçerek boş saatleri görün.</div>
              </div>
            ) : (
              <>
                <div className="mb-3 text-[13.5px] font-extrabold">
                  {fmtLong(date)}
                  <span className="ml-1 font-semibold text-stone-400">
                    · {slotsLoading ? "…" : `${slots.length} boş`}
                  </span>
                </div>
                {slotsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-stone-500">
                    <Loader2 className="h-5 w-5 animate-spin" /> Yükleniyor…
                  </div>
                ) : slots.length === 0 ? (
                  <div className="px-2 py-10 text-center text-stone-400">
                    <div className="text-[13px] font-bold text-stone-600">Boş saat kalmadı</div>
                    <div className="text-[12px]">Başka bir gün seçin.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {ALL_SLOTS.map((t) => {
                      const free = freeSet.has(t);
                      const sel = pendingSlot === t;
                      return (
                        <button
                          key={t}
                          disabled={!free}
                          onClick={() => setPendingSlot(t)}
                          className={
                            sel
                              ? "h-[38px] rounded-[9px] border border-teal-600 bg-teal-600 text-[12.5px] font-bold text-white"
                              : free
                                ? "h-[38px] rounded-[9px] border border-teal-100 bg-teal-50 text-[12.5px] font-bold text-teal-700 transition hover:bg-teal-100"
                                : "h-[38px] cursor-not-allowed rounded-[9px] border border-stone-100 bg-stone-50 text-[12.5px] font-semibold text-stone-300 line-through"
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

        {/* Alt bar */}
        <div className="mt-5 flex items-center gap-2.5">
          <div className="mr-auto text-[13px]">
            {pendingSlot ? (
              <span className="font-bold text-stone-700">
                Yeni: {fmtShort(date)} · <span className="text-teal-600">{pendingSlot}</span>
              </span>
            ) : (
              <span className="text-stone-400">Yeni bir gün ve saat seçin.</span>
            )}
          </div>
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="h-[44px] rounded-[11px] border border-stone-200 bg-white px-5 text-sm font-bold text-stone-600 transition hover:bg-stone-50 disabled:opacity-60"
          >
            Vazgeç
          </button>
          <button
            onClick={confirm}
            disabled={saving || !pendingSlot}
            className="flex h-[44px] items-center justify-center gap-2 rounded-[11px] bg-teal-600 px-6 text-sm font-bold text-white shadow-[0_6px_16px_rgba(13,148,136,.28)] transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Ertele
          </button>
        </div>
      </div>
    </Modal>
  );
}
