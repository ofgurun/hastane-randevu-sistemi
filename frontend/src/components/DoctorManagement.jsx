import { useEffect, useState } from "react";
import { Plus, Loader2, Stethoscope, CalendarCog, CalendarOff, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getAllDoctors, createDoctor } from "../services/doctorService";
import { getDepartments } from "../services/departmentService";
import DoctorCalendarModal from "./DoctorCalendarModal";
import DeleteDoctorModal from "./DeleteDoctorModal";
import LeaveModal from "./LeaveModal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = { name: "", email: "", password: "", title: "", departmentId: "", backupDoctorId: "" };

// Admin — doktor listeleme + ekleme (DOKTOR user + profil tek transaction'da).
export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [calendarDoctor, setCalendarDoctor] = useState(null); // takvimi açık doktor
  const [leaveDoctor, setLeaveDoctor] = useState(null); // izne ayrılan doktor
  const [deletingDoctor, setDeletingDoctor] = useState(null); // silinmek üzere olan doktor

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [docs, deps] = await Promise.all([getAllDoctors(), getDepartments()]);
        if (active) {
          setDoctors(docs);
          setDepartments(deps);
        }
      } catch {
        if (active) toast.error("Doktorlar/bölümler yüklenemedi.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email || !form.password || !form.title.trim() || !form.departmentId) {
      toast.error("Lütfen tüm alanları doldurun.");
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
      setDoctors((prev) => [...prev, created]); // listeyi anında güncelle
      toast.success("Doktor eklendi.");
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.message || "Doktor eklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Ekleme formu */}
      <div className="lg:col-span-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Yeni Doktor Ekle</h2>

          {!loading && departments.length === 0 ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Önce en az bir bölüm eklemelisiniz.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div>
                <label htmlFor="doc-name" className="mb-1.5 block text-sm font-medium text-slate-700">Ad Soyad</label>
                <input id="doc-name" type="text" value={form.name} onChange={setField("name")} placeholder="Dr. Adı Soyadı" className={inputCls} />
              </div>
              <div>
                <label htmlFor="doc-email" className="mb-1.5 block text-sm font-medium text-slate-700">E-posta</label>
                <input id="doc-email" type="email" value={form.email} onChange={setField("email")} placeholder="ornek@eposta.com" className={inputCls} />
              </div>
              <div>
                <label htmlFor="doc-pass" className="mb-1.5 block text-sm font-medium text-slate-700">Şifre</label>
                <input id="doc-pass" type="password" value={form.password} onChange={setField("password")} placeholder="En az 6 karakter" className={inputCls} />
              </div>
              <div>
                <label htmlFor="doc-title" className="mb-1.5 block text-sm font-medium text-slate-700">Ünvan</label>
                <input id="doc-title" type="text" value={form.title} onChange={setField("title")} placeholder="Örn: Uzm. Dr." className={inputCls} />
              </div>
              <div>
                <label htmlFor="doc-dept" className="mb-1.5 block text-sm font-medium text-slate-700">Bölüm</label>
                <select
                  id="doc-dept"
                  value={form.departmentId}
                  onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, backupDoctorId: "" }))}
                  className={inputCls}
                >
                  <option value="">Bölüm seçin…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="doc-backup" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Yedek Doktor <span className="text-slate-400">(aynı bölümden, opsiyonel)</span>
                </label>
                <select
                  id="doc-backup"
                  value={form.backupDoctorId}
                  onChange={setField("backupDoctorId")}
                  disabled={!form.departmentId}
                  className={`${inputCls} disabled:cursor-not-allowed disabled:bg-slate-50`}
                >
                  <option value="">Yedek doktor seçin…</option>
                  {doctors
                    .filter((d) => d.department?.id === Number(form.departmentId))
                    .map((d) => (
                      <option key={d.id} value={d.id}>{d.user?.name} ({d.title})</option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Ekleniyor…
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" /> Doktor Ekle
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Mevcut doktorlar */}
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-slate-900">
              Mevcut Doktorlar {!loading && <span className="text-slate-400">({doctors.length})</span>}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Yükleniyor…
            </div>
          ) : doctors.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Stethoscope className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-2">Henüz doktor yok. Soldaki formdan ekleyin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Ad</th>
                    <th className="px-5 py-2.5 font-medium">Ünvan</th>
                    <th className="px-5 py-2.5 font-medium">Bölüm</th>
                    <th className="px-5 py-2.5 font-medium">E-posta</th>
                    <th className="px-5 py-2.5 font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => (
                    <tr key={d.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-900">{d.user?.name}</td>
                      <td className="px-5 py-3 text-slate-600">{d.title}</td>
                      <td className="px-5 py-3 text-slate-600">{d.department?.name}</td>
                      <td className="px-5 py-3 text-slate-500">{d.user?.email}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCalendarDoctor(d)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            <CalendarCog className="h-4 w-4" /> Takvim
                          </button>
                          <button
                            onClick={() => setLeaveDoctor(d)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                          >
                            <CalendarOff className="h-4 w-4" /> İzne Ayır
                          </button>
                          <button
                            onClick={() => setDeletingDoctor(d)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" /> Kaldır
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Doktor takvim modalı */}
      {calendarDoctor && (
        <DoctorCalendarModal doctor={calendarDoctor} onClose={() => setCalendarDoctor(null)} />
      )}

      {/* İzne ayırma modalı */}
      {leaveDoctor && <LeaveModal doctor={leaveDoctor} onClose={() => setLeaveDoctor(null)} />}

      {/* Doktor silme modalı */}
      {deletingDoctor && (
        <DeleteDoctorModal
          doctor={deletingDoctor}
          onClose={() => setDeletingDoctor(null)}
          onDeleted={(id) => setDoctors((prev) => prev.filter((d) => d.id !== id))}
        />
      )}
    </div>
  );
}
