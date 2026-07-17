import { useState } from "react";
import { Loader2, CalendarOff, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { decideLeaveRequest } from "../services/doctorService";
import StatusBadge from "./StatusBadge";
import { initials, fmtShort } from "../utils/ui";

// Admin — İzin Talepleri sekmesi: bekleyenler önce; Onayla → izin uygulanır
// (günler kapatılır + AKTIF randevular yedeğe aktarılır), Reddet → REDDEDILDI.
export default function LeaveRequestManagement({ requests, onDecided }) {
  const [busyId, setBusyId] = useState(null);

  const decide = async (id, action) => {
    setBusyId(id);
    try {
      const res = await decideLeaveRequest(id, action);
      onDecided(id, res.status);
      if (action === "approve") {
        toast.success(
          `Talep onaylandı; ${res.blockedDays} gün randevuya kapatıldı` +
            (res.transferred > 0 ? `, ${res.transferred} randevu yedeğe aktarıldı` : "") +
            (res.cancelled > 0 ? `, ${res.cancelled} çakışan randevu iptal edildi` : "") +
            "."
        );
      } else {
        toast.success("Talep reddedildi.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "İşlem yapılamadı.");
    } finally {
      setBusyId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-[18px] border border-stone-200 bg-white px-5 py-14 text-center">
        <CalendarOff className="mx-auto mb-2.5 h-9 w-9 text-stone-300" />
        <div className="mb-1 text-base font-bold">İzin talebi yok</div>
        <div className="text-sm text-stone-500">Doktorlardan gelen talepler burada listelenir.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {requests.map((r) => (
        <div
          key={r.id}
          className={`flex flex-wrap items-center gap-[18px] rounded-2xl border border-stone-200 bg-white px-[22px] py-[18px] ${
            r.status !== "BEKLIYOR" ? "opacity-60" : ""
          }`}
        >
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] border border-teal-100 bg-teal-50 text-[15px] font-extrabold text-teal-700">
            {initials(r.doctor?.user?.name)}
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="mb-[3px] flex items-center gap-2">
              <span className="text-[15px] font-bold">
                {r.doctor?.title} {r.doctor?.user?.name}
              </span>
              <StatusBadge status={r.status} />
            </div>
            <div className="text-[13px] text-stone-500">
              {r.doctor?.department?.name} ·{" "}
              <b className="text-stone-600">
                {fmtShort(r.startDate)} → {fmtShort(r.endDate)}
              </b>
            </div>
            <div className="mt-0.5 text-xs text-stone-400">
              {r.doctor?.backupDoctor?.user?.name
                ? `Yedek doktor: ${r.doctor.backupDoctor.user.name}`
                : "Yedek doktor tanımlı değil"}
            </div>
            {r.reason && (
              <div className="mt-2 rounded-[10px] border border-stone-100 bg-stone-50 px-3 py-2 text-[12.5px] leading-normal text-stone-600">
                <span className="font-bold text-stone-500">Açıklama: </span>
                {r.reason}
              </div>
            )}
          </div>

          {r.status === "BEKLIYOR" && (
            <div className="flex gap-2">
              <button
                onClick={() => decide(r.id, "approve")}
                disabled={busyId !== null}
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-emerald-600 px-[18px] text-[13.5px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Onayla
              </button>
              <button
                onClick={() => decide(r.id, "reject")}
                disabled={busyId !== null}
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-red-200 bg-white px-[18px] text-[13.5px] font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" /> Reddet
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
