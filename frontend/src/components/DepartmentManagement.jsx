import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { createDepartment } from "../services/departmentService";
import { deptAbbr, tileColor } from "../utils/ui";

const inputCls =
  "w-full rounded-[11px] border border-stone-200 bg-stone-50 px-[13px] text-sm text-stone-800 outline-none transition focus:border-teal-500";

// Admin — Bölümler sekmesi: solda ekleme formu, sağda bölüm kartları.
export default function DepartmentManagement({ departments, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      onCreated(created);
      toast.success(`${created.name} eklendi.`);
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
    <div className="grid items-start gap-[22px] lg:grid-cols-[340px_1fr]">
      {/* Ekleme formu */}
      <div className="rounded-[20px] border border-stone-200 bg-white p-[22px]">
        <h2 className="mb-4 text-base font-extrabold">Yeni Bölüm Ekle</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">Bölüm Adı</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Üroloji"
              className={`${inputCls} h-11`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">
              Açıklama <span className="font-medium text-stone-400">(opsiyonel)</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kısa açıklama"
              className={`${inputCls} h-[78px] resize-y py-2.5`}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 items-center justify-center gap-2 rounded-[11px] bg-teal-600 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Bölüm Ekle
          </button>
        </form>
      </div>

      {/* Bölüm kartları */}
      <div>
        <div className="mb-3.5 flex items-center gap-2.5">
          <h2 className="text-base font-extrabold">Bölümler</h2>
          <span className="text-[12.5px] font-semibold text-stone-400">{departments.length} bölüm</span>
        </div>
        {departments.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-5 py-12 text-center">
            <div className="mb-1 text-[15px] font-bold">Henüz bölüm yok</div>
            <div className="text-[13.5px] text-stone-500">Soldaki formdan ilk bölümü ekleyin.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {departments.map((dept, i) => {
              const tc = tileColor(i);
              return (
                <div key={dept.id} className="rounded-2xl border border-stone-200 bg-white px-[18px] py-4">
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className={`flex h-[38px] w-[38px] items-center justify-center rounded-[11px] text-[13px] font-extrabold ${tc.bg} ${tc.text}`}>
                      {deptAbbr(dept.name)}
                    </div>
                    <div className="text-[14.5px] font-bold">{dept.name}</div>
                  </div>
                  <div className="text-[12.5px] leading-normal text-stone-500">
                    {dept.description || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
