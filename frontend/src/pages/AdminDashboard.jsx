import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import DepartmentManagement from "../components/DepartmentManagement";
import DoctorManagement from "../components/DoctorManagement";
import AdminCalendar from "../components/AdminCalendar";
import LeaveRequestManagement from "../components/LeaveRequestManagement";
import { getDepartments } from "../services/departmentService";
import { getAllDoctors, getLeaveRequests } from "../services/doctorService";

const TABS = [
  { key: "depts", label: "Bölümler" },
  { key: "doctors", label: "Doktorlar" },
  { key: "calendar", label: "Takvim" },
  { key: "leaves", label: "İzin Talepleri" },
];

// Admin Paneli — sekmeli görünüm: Bölümler · Doktorlar · Takvim · İzin Talepleri.
// Veriler panelde bir kez yüklenir ve sekmelere prop olarak dağıtılır.
export default function AdminDashboard() {
  const [tab, setTab] = useState("depts");
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarDoctorId, setCalendarDoctorId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [deps, docs, reqs] = await Promise.all([
        getDepartments(),
        getAllDoctors(),
        getLeaveRequests(),
      ]);
      setDepartments(deps);
      setDoctors(docs);
      setLeaves(reqs);
    } catch {
      toast.error("Panel verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = leaves.filter((l) => l.status === "BEKLIYOR").length;

  return (
    <div className="min-h-screen bg-stone-100">
      <Navbar />

      <main className="mx-auto max-w-[1200px] animate-fadeUp px-6 pb-16 pt-8">
        <h1 className="mb-[18px] text-[26px] font-extrabold tracking-tight">Yönetim Paneli</h1>

        {/* Sekmeler */}
        <div className="mb-[26px] flex flex-wrap gap-1 rounded-[13px] border border-stone-200 bg-white p-[5px]">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center rounded-[9px] px-4 py-[9px] text-[13.5px] font-bold transition ${
                  active ? "bg-teal-600 text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                }`}
              >
                {t.label}
                {t.key === "leaves" && pendingCount > 0 && (
                  <span className="ml-[7px] rounded-[20px] bg-amber-500 px-[7px] py-px text-[11px] font-extrabold text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-stone-500">
            <Loader2 className="h-6 w-6 animate-spin" /> Panel yükleniyor…
          </div>
        ) : (
          <>
            {tab === "depts" && (
              <DepartmentManagement
                departments={departments}
                onCreated={(d) => setDepartments((prev) => [...prev, d])}
              />
            )}

            {tab === "doctors" && (
              <DoctorManagement
                doctors={doctors}
                departments={departments}
                onCreated={(d) => setDoctors((prev) => [...prev, d])}
                onDeleted={(id) =>
                  setDoctors((prev) =>
                    prev
                      .filter((d) => d.id !== id)
                      .map((d) => (d.backupDoctorId === id ? { ...d, backupDoctorId: null } : d))
                  )
                }
                onOpenCalendar={(doctorId) => {
                  setCalendarDoctorId(doctorId);
                  setTab("calendar");
                }}
              />
            )}

            {tab === "calendar" &&
              (doctors.length === 0 ? (
                <div className="rounded-[18px] border border-stone-200 bg-white px-5 py-14 text-center">
                  <div className="mb-1 text-base font-bold">Henüz doktor yok</div>
                  <div className="text-sm text-stone-500">
                    Takvim yönetimi için önce Doktorlar sekmesinden doktor ekleyin.
                  </div>
                </div>
              ) : (
                <AdminCalendar
                  key={calendarDoctorId ?? "default"}
                  doctors={doctors}
                  initialDoctorId={calendarDoctorId}
                />
              ))}

            {tab === "leaves" && (
              <LeaveRequestManagement
                requests={leaves}
                onDecided={(id, status) =>
                  setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
                }
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
