import { useState } from "react";
import { Loader2, CalendarDays, CalendarOff, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { createDoctor } from "../services/doctorService";
import DeleteDoctorModal from "./DeleteDoctorModal";
import LeaveModal from "./LeaveModal";
import { initials } from "../utils/ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyForm = { name: "", email: "", password: "", title: "", departmentId: "", backupDoctorId: "" };
const PAGE_SIZE = 7; // tabloda sayfa başına doktor sayısı

const inputCls =
  "h-[42px] w-full rounded-[10px] border border-stone-200 bg-stone-50 px-3 text-[13.5px] text-stone-800 outline-none transition focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";

// Admin — Doktorlar sekmesi: solda ekleme formu, sağda tablo (7'li sayfalama).
export default function DoctorManagement({ doctors, departments, onCreated, onDeleted, onOpenCalendar }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [leaveDoctor, setLeaveDoctor] = useState(null);
  const [deletingDoctor, setDeletingDoctor] = useState(null);
  const [page, setPage] = useState(1);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Sayfalama: silme sonrası sayfa taşarsa son sayfaya çek
  const totalPages = Math.max(1, Math.ceil(doctors.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageDoctors = doctors.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const doctorById = (id) => doctors.find((d) => d.id === id);

  const onSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email || !form.password || !form.title.trim() || !form.departmentId) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      toast.error("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createDoctor({
        name,
        email,
        password: form.password,
        title: form.title.trim(),
        departmentId: Number(form.departmentId),
        backupDoctorId: form.backupDoctorId ? Number(form.backupDoctorId) : undefined,
      });
      onCreated(created);
      toast.success(`${created.user?.name || name} sisteme eklendi.`);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.message || "Doktor eklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const iconBtn =
    "flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border transition";

  return (
    <div className="grid items-start gap-[22px] lg:grid-cols-[360px_1fr]">
      {/* Ekleme formu */}
      <div className="rounded-[20px] border border-stone-200 bg-white p-[22px]">
        <h2 className="mb-4 text-base font-extrabold">Yeni Doktor Ekle</h2>
        {departments.length === 0 ? (
          <p className="rounded-[11px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-800">
            Önce en az bir bölüm eklemelisiniz.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-[13px]">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">Ad Soyad</span>
              <input value={form.name} onChange={setField("name")} placeholder="Dr. Ad Soyad" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">E-posta</span>
              <input value={form.email} onChange={setField("email")} type="email" placeholder="doktor@medirandevu.com" className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">Şifre</span>
                <input value={form.password} onChange={setField("password")} type="password" placeholder="••••••" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">Ünvan</span>
                <input value={form.title} onChange={setField("title")} placeholder="Uzm. Dr." className={inputCls} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">Bölüm</span>
              <select
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, backupDoctorId: "" }))}
                className={inputCls}
              >
                <option value="">Bölüm seçin</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">
                Yedek Doktor <span className="font-medium text-stone-400">(opsiyonel · aynı bölüm)</span>
              </span>
              <select
                value={form.backupDoctorId}
                onChange={setField("backupDoctorId")}
                disabled={!form.departmentId}
                className={inputCls}
              >
                <option value="">{form.departmentId ? "Yedek doktor seçin" : "Önce bölüm seçin"}</option>
                {doctors
                  .filter((d) => d.department?.id === Number(form.departmentId))
                  .map((d) => (
                    <option key={d.id} value={d.id}>{d.title} {d.user?.name}</option>
                  ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="mt-0.5 flex h-11 items-center justify-center gap-2 rounded-[11px] bg-teal-600 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Doktor Ekle
            </button>
          </form>
        )}
      </div>

      {/* Doktor tablosu */}
      <div>
        <div className="mb-3.5 flex items-center gap-2.5">
          <h2 className="text-base font-extrabold">Doktorlar</h2>
          <span className="text-[12.5px] font-semibold text-stone-400">{doctors.length} doktor</span>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-stone-200 bg-white">
          {doctors.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mb-1 text-[15px] font-bold">Henüz doktor yok</div>
              <div className="text-[13.5px] text-stone-500">Soldaki formdan ekleyin.</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[2fr_1.4fr_1fr_auto] gap-3 border-b border-stone-200 bg-stone-50 px-5 py-[13px] text-[11.5px] font-bold uppercase tracking-[.04em] text-stone-400">
                <span>Doktor</span>
                <span>Bölüm</span>
                <span>Yedek</span>
                <span className="text-right">İşlemler</span>
              </div>
              {pageDoctors.map((d) => {
                const backup = d.backupDoctorId ? doctorById(d.backupDoctorId) : null;
                return (
                  <div
                    key={d.id}
                    className="grid grid-cols-[2fr_1.4fr_1fr_auto] items-center gap-3 border-b border-stone-100 px-5 py-3.5"
                  >
                    <div className="flex items-center gap-[11px]">
                      <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border border-teal-100 bg-teal-50 text-[13px] font-extrabold text-teal-700">
                        {initials(d.user?.name)}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{d.user?.name}</div>
                        <div className="text-[11.5px] text-stone-400">{d.title}</div>
                      </div>
                    </div>
                    <div className="text-[13px] text-stone-600">{d.department?.name}</div>
                    <div className="text-[12.5px] text-stone-500">{backup?.user?.name || "—"}</div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onOpenCalendar(d.id)}
                        title="Takvim"
                        className={`${iconBtn} border-stone-200 bg-stone-50 text-teal-600 hover:bg-teal-50`}
                      >
                        <CalendarDays className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setLeaveDoctor(d)}
                        title="İzne Ayır"
                        className={`${iconBtn} border-stone-200 bg-stone-50 text-amber-700 hover:bg-amber-50`}
                      >
                        <CalendarOff className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingDoctor(d)}
                        title="Kaldır"
                        className={`${iconBtn} border-red-200 bg-white text-red-600 hover:bg-red-50`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {/* Sayfalama */}
              <div className="flex items-center justify-between px-5 py-[13px]">
                <span className="text-[13px] font-semibold text-stone-500">
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, doctors.length)} / {doctors.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(safePage - 1)}
                    disabled={safePage === 1}
                    className="inline-flex h-[38px] items-center gap-1 rounded-[9px] border border-stone-200 bg-stone-50 px-4 text-[13px] font-bold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-300"
                  >
                    <ChevronLeft className="h-4 w-4" /> Önceki
                  </button>
                  <button
                    onClick={() => setPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="inline-flex h-[38px] items-center gap-1 rounded-[9px] border border-stone-200 bg-stone-50 px-4 text-[13px] font-bold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-300"
                  >
                    Sonraki <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* İzne ayırma modalı */}
      {leaveDoctor && <LeaveModal doctor={leaveDoctor} onClose={() => setLeaveDoctor(null)} />}

      {/* Doktor silme modalı */}
      {deletingDoctor && (
        <DeleteDoctorModal
          doctor={deletingDoctor}
          onClose={() => setDeletingDoctor(null)}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
}
