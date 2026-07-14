import { useEffect, useState } from "react";
import { Plus, Loader2, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { getDepartments, createDepartment } from "../services/departmentService";

// Admin — bölüm listeleme + ekleme.
export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getDepartments();
        if (active) setDepartments(data);
      } catch {
        if (active) toast.error("Bölümler yüklenemedi.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Bölüm adı zorunludur.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createDepartment({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setDepartments((prev) => [...prev, created]); // listeyi anında güncelle
      toast.success("Bölüm eklendi.");
      setName("");
      setDescription("");
    } catch (err) {
      // Aynı isim → backend 409
      toast.error(err.response?.data?.message || "Bölüm eklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Ekleme formu */}
      <div className="lg:col-span-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Yeni Bölüm Ekle</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="dep-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Bölüm Adı
              </label>
              <input
                id="dep-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Kardiyoloji"
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label htmlFor="dep-desc" className="mb-1.5 block text-sm font-medium text-slate-700">
                Açıklama <span className="text-slate-400">(opsiyonel)</span>
              </label>
              <textarea
                id="dep-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kısa açıklama…"
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
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
                  <Plus className="h-5 w-5" /> Bölüm Ekle
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Mevcut bölümler */}
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-slate-900">
              Mevcut Bölümler{" "}
              {!loading && <span className="text-slate-400">({departments.length})</span>}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Yükleniyor…
            </div>
          ) : departments.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Building2 className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-2">Henüz bölüm yok. Soldaki formdan ekleyin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Bölüm</th>
                    <th className="px-5 py-2.5 font-medium">Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-900">{d.name}</td>
                      <td className="px-5 py-3 text-slate-500">{d.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
