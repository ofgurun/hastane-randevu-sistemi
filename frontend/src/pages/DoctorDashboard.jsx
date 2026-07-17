import { useCallback, useEffect, useState } from "react";
import {
  Loader2, CalendarX2, ChevronDown, ChevronLeft, ChevronRight, Check, X,
  CalendarOff, AlertTriangle, User,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import LeaveRequestModal from "../components/LeaveRequestModal";
import { getDoctorAppointments, completeAppointment, cancelAppointment } from "../services/appointmentService";
import { getMyLeaveRequests, getMyAvailability } from "../services/doctorService";
import { MONTHS, WEEK_HEADER, fmtShort, fmtLong, apptStart, todayStr } from "../utils/ui";

const TWO_HOURS = 2 * 60 * 60 * 1000;

// ISO tarih → "YYYY-MM-DD" (yerel gün)
function localDateStr(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Görüntülenecek durum: AKTIF + başlangıçtan 2 saat geçmiş → TARİHİ GEÇTİ
function displayStatus(a) {
  if (a.status === "AKTIF" && Date.now() > apptStart(a).getTime() + TWO_HOURS) return "GECTI";
  return a.status;
}

// Doktor Paneli — Takvimim (yoğunluk renkli) + gün detayı + ajanda + izin talepleri.
export default function DoctorDashboard() {
  const now = new Date();
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Takvimim durumu
  const [monthDate, setMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [availDays, setAvailDays] = useState([]);
  const [calLoading, setCalLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayStr()); // varsayılan: bugün

  const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

  const load = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const [appts, reqs] = await Promise.all([getDoctorAppointments(), getMyLeaveRequests()]);
      setItems(appts);
      setRequests(reqs);
    } catch {
      setLoadError(true);
      toast.error("Ajanda yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCalendar = useCallback(async () => {
    setCalLoading(true);
    try {
      const data = await getMyAvailability(monthStr);
      setAvailDays(data.days);
    } catch {
      toast.error("Takvim yüklenemedi.");
      setAvailDays([]);
    } finally {
      setCalLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const shiftMonth = (delta) =>
    setMonthDate((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  // Gün başına randevu sayısı (İPTAL hariç — geçmişteki TAMAMLANDI'lar dahil)
  const apptCountByDate = {};
  for (const a of items) {
    if (a.status === "IPTAL") continue;
    const ds = localDateStr(a.date);
    apptCountByDate[ds] = (apptCountByDate[ds] || 0) + 1;
  }

  // Yoğunluk barı: kapalı gün → kırmızı; doluluk %71+ kırmızı, %31-70 turuncu, aksi yeşil.
  const barColor = (d) => {
    if (d.dayClosed) return "bg-red-500";
    const busy = Math.max(d.totalSlots - d.availableCount, apptCountByDate[d.date] || 0);
    const occ = (busy / d.totalSlots) * 100;
    if (occ > 70) return "bg-red-500";
    if (occ > 30) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Seçili günün randevuları (saat sırasıyla, İPTAL dahil — soluk görünür)
  const dayAppointments = items
    .filter((a) => localDateStr(a.date) === selectedDate)
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  const selectedAvail = availDays.find((d) => d.date === selectedDate);

  const firstOffset =
    availDays.length > 0 ? (new Date(availDays[0].date + "T00:00:00").getDay() + 6) % 7 : 0;

  const onComplete = async (id) => {
    setBusyId(id);
    setMenuId(null);
    try {
      await completeAppointment(id);
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status: "TAMAMLANDI" } : a)));
      toast.success("Randevu tamamlandı olarak işaretlendi.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Randevu işaretlenemedi.");
    } finally {
      setBusyId(null);
    }
  };

  const doCancel = async () => {
    setCancelling(true);
    try {
      await cancelAppointment(cancelTarget.id);
      setItems((prev) => prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: "IPTAL" } : a)));
      toast.success("Randevu iptal edildi. Hastaya bilgilendirme e-postası gönderildi.");
      setCancelTarget(null);
      loadCalendar(); // doluluk barları güncellensin
    } catch (err) {
      toast.error(err.response?.data?.message || "Randevu iptal edilemedi.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <Navbar />

      <main className="mx-auto max-w-[1080px] animate-fadeUp px-6 pb-16 pt-8">
        <div className="mb-[26px] flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight">Randevu Ajandası</h1>
            <p className="text-[14.5px] text-stone-500">
              Takviminizden bir güne tıklayarak o günün randevularını görün.
            </p>
          </div>
          <button
            onClick={() => setLeaveModalOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-[11px] border border-teal-100 bg-teal-50 px-5 text-sm font-bold text-teal-700 transition hover:bg-teal-100"
          >
            <CalendarOff className="h-[17px] w-[17px]" /> İzin Talep Et
          </button>
        </div>

        <div className="grid items-start gap-[22px] lg:grid-cols-[1.6fr_1fr]">
          {/* Sol sütun: Takvimim + Randevular */}
          <div className="flex flex-col gap-[22px]">
            {/* Takvimim */}
            <div className="rounded-[20px] border border-stone-200 bg-white px-6 py-[22px]">
              <div className="mb-3.5 flex items-center justify-between">
                <h2 className="text-[17px] font-extrabold">Takviminiz</h2>
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

              {calLoading ? (
                <div className="flex items-center justify-center gap-2 py-14 text-stone-500">
                  <Loader2 className="h-5 w-5 animate-spin" /> Takvim yükleniyor…
                </div>
              ) : (
                <>
                  <div className="mb-2 grid grid-cols-7 gap-1.5">
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
                    {availDays.map((d) => {
                      const dayNum = Number(d.date.slice(-2));
                      const sel = selectedDate === d.date;
                      const isToday = d.date === todayStr();
                      return (
                        <button
                          key={d.date}
                          onClick={() => setSelectedDate(d.date)}
                          className={`flex h-[46px] flex-col items-center justify-center rounded-[11px] border text-[13.5px] font-bold transition ${
                            sel
                              ? "border-teal-600 bg-teal-600 text-white"
                              : isToday
                                ? "border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100"
                                : "border-stone-100 bg-white text-stone-800 hover:border-teal-300 hover:bg-teal-50"
                          }`}
                        >
                          <span>{dayNum}</span>
                          {!sel && <span className={`mt-1 block h-1 w-[70%] rounded-[3px] ${barColor(d)}`} />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3.5 border-t border-stone-100 pt-3.5">
                    <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-600">
                      <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-500" /> Sakin
                    </span>
                    <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-600">
                      <span className="h-2.5 w-2.5 rounded-[3px] bg-amber-500" /> Orta yoğun
                    </span>
                    <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-600">
                      <span className="h-2.5 w-2.5 rounded-[3px] bg-red-500" /> Yoğun / izinli-kapalı
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Tüm randevular */}
            <div>
              <div className="mb-3.5 flex items-center gap-2.5">
                <h2 className="text-[17px] font-extrabold">Tüm Randevular</h2>
                {!loading && !loadError && (
                  <span className="text-[12.5px] font-semibold text-stone-400">{items.length} kayıt</span>
                )}
              </div>

              {loading && (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[78px] rounded-2xl border border-stone-200 bg-white" />
                  ))}
                </div>
              )}

              {!loading && loadError && (
                <div className="rounded-2xl border border-stone-200 bg-white px-5 py-11 text-center">
                  <div className="mb-3.5 text-[15px] font-bold">Ajanda yüklenemedi</div>
                  <button
                    onClick={load}
                    className="h-10 rounded-[10px] bg-teal-600 px-5 text-sm font-bold text-white transition hover:bg-teal-700"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}

              {!loading && !loadError && items.length === 0 && (
                <div className="rounded-2xl border border-stone-200 bg-white px-5 py-12 text-center">
                  <CalendarX2 className="mx-auto mb-2.5 h-9 w-9 text-stone-300" />
                  <div className="mb-1 text-[15px] font-bold">Randevu bulunmuyor</div>
                  <div className="text-[13.5px] text-stone-500">Yeni randevular burada listelenecek.</div>
                </div>
              )}

              {!loading && !loadError && items.length > 0 && (
                <div className="flex flex-col gap-3">
                  {items.map((a) => {
                    const started = Date.now() >= apptStart(a).getTime();
                    const st = displayStatus(a);
                    const dimmed = a.status === "IPTAL" || st === "GECTI";
                    const menuOpen = menuId === a.id;
                    return (
                      <div
                        key={a.id}
                        className={`rounded-2xl border border-stone-200 bg-white px-[18px] py-[15px] ${dimmed ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="min-w-[52px] text-center">
                            <div className="text-[15px] font-extrabold tracking-tight">{a.timeSlot}</div>
                            <div className="text-[11px] font-semibold text-stone-400">{fmtShort(a.date)}</div>
                          </div>
                          <div className="h-[34px] w-px bg-stone-200" />
                          <div className="flex-1">
                            <div className="text-[15px] font-bold tracking-tight">{a.patient?.name}</div>
                            <div className="mt-[5px]">
                              <StatusBadge status={st} />
                            </div>
                          </div>

                          {a.status === "AKTIF" && (
                            <div className="relative">
                              <button
                                onClick={() => setMenuId(menuOpen ? null : a.id)}
                                disabled={busyId === a.id}
                                className="inline-flex h-[38px] items-center gap-1.5 rounded-[10px] border border-stone-200 bg-stone-50 px-3.5 text-[13px] font-bold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {busyId === a.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> İşleniyor…
                                  </>
                                ) : (
                                  <>
                                    İşlem Yap <ChevronDown className="h-3.5 w-3.5" />
                                  </>
                                )}
                              </button>

                              {menuOpen && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                                  <div className="absolute right-0 top-11 z-20 w-[196px] rounded-xl border border-stone-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(41,37,36,.16)]">
                                    <button
                                      onClick={() => onComplete(a.id)}
                                      disabled={!started}
                                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-[9px] text-left text-[13.5px] font-semibold transition ${
                                        started
                                          ? "text-emerald-700 hover:bg-emerald-50"
                                          : "cursor-not-allowed text-stone-300"
                                      }`}
                                    >
                                      <Check className="h-4 w-4" /> Tamamlandı
                                    </button>
                                    {!started && (
                                      <div className="px-3 pb-1.5 pt-0.5 text-[11px] leading-snug text-stone-400">
                                        Saati gelmemiş randevu tamamlanamaz.
                                      </div>
                                    )}
                                    <button
                                      onClick={() => {
                                        setMenuId(null);
                                        setCancelTarget(a);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-[9px] text-left text-[13.5px] font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                      <X className="h-4 w-4" /> Sil / İptal Et
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sağ sütun: gün detayı + izin taleplerim */}
          <div className="flex flex-col gap-[22px]">
            {/* Seçili günün randevuları */}
            <div className="rounded-[20px] border border-stone-200 bg-white p-[22px]">
              <h2 className="text-base font-extrabold">{fmtLong(selectedDate)}</h2>
              <p className="mb-4 mt-0.5 text-[12.5px] text-stone-400">
                {selectedAvail?.dayClosed
                  ? "Bu gün randevuya kapalı (izinli)."
                  : `${dayAppointments.filter((a) => a.status !== "IPTAL").length} randevu`}
              </p>

              {dayAppointments.length === 0 ? (
                <div className="px-2.5 py-8 text-center text-stone-400">
                  <User className="mx-auto mb-2 h-8 w-8 text-stone-200" />
                  <div className="mb-[3px] text-sm font-bold text-stone-600">Randevu yok</div>
                  <div className="text-[12.5px]">Bu günde planlanmış randevu bulunmuyor.</div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {dayAppointments.map((a) => (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 rounded-[13px] border border-stone-100 bg-stone-50 px-3.5 py-3 ${
                        a.status === "IPTAL" ? "opacity-55" : ""
                      }`}
                    >
                      <div className="min-w-[44px] text-[14px] font-extrabold tracking-tight text-teal-700">
                        {a.timeSlot}
                      </div>
                      <div className="h-[26px] w-px bg-stone-200" />
                      <div className="flex-1">
                        <div className="text-[13.5px] font-bold">{a.patient?.name}</div>
                        <div className="mt-1">
                          <StatusBadge status={displayStatus(a)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* İzin taleplerim */}
            <div className="rounded-[20px] border border-stone-200 bg-white p-[22px]">
              <h2 className="mb-1 text-base font-extrabold">İzin Taleplerim</h2>
              <p className="mb-4 text-[12.5px] text-stone-400">Onay durumlarını takip edin.</p>
              {!loading && requests.length === 0 && (
                <div className="px-2.5 py-8 text-center text-stone-400">
                  <div className="mb-[3px] text-sm font-bold text-stone-600">Talep yok</div>
                  <div className="text-[12.5px]">Henüz izin talebiniz bulunmuyor.</div>
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                {requests.map((r) => (
                  <div key={r.id} className="rounded-[13px] border border-stone-100 px-[15px] py-[13px]">
                    <div className="mb-[5px] flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-bold">
                        {fmtShort(r.startDate)} → {fmtShort(r.endDate)}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.reason && (
                      <div className="mb-1 text-[12px] leading-normal text-stone-500">{r.reason}</div>
                    )}
                    <div className="text-[11.5px] text-stone-400">Talep: {fmtShort(r.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
              <b className="text-stone-800">{cancelTarget.patient?.name}</b> adlı hastanın{" "}
              {fmtShort(cancelTarget.date)} · {cancelTarget.timeSlot} randevusunu iptal etmek
              istediğinize emin misiniz? Hastaya bilgilendirme e-postası gönderilecektir.
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

      {/* İzin talebi modalı */}
      {leaveModalOpen && (
        <LeaveRequestModal
          onClose={() => setLeaveModalOpen(false)}
          onCreated={(r) => {
            setRequests((prev) => [r, ...prev]);
          }}
        />
      )}
    </div>
  );
}
