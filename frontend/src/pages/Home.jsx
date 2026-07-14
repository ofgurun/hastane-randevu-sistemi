import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import DepartmentCard from "../components/DepartmentCard";
import DoctorModal from "../components/DoctorModal";
import BookingModal from "../components/BookingModal";
import useAuthStore from "../store/authStore";
import { getDepartments } from "../services/departmentService";
import { getDoctorsByDepartment } from "../services/doctorService";

// Hasta Ana Sayfası — bölümleri listeler; bir bölüme tıklanınca doktorları modalda gösterir.
// Not: giriş yapılmamışsa /login'e yönlendirir (kalıcı ProtectedRoute Gün 13'te).
export default function Home() {
  const { isAuthenticated } = useAuthStore();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Seçili bölüm + o bölümün doktorları
  const [selected, setSelected] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // Randevu alınacak doktor (BookingModal)
  const [bookingDoctor, setBookingDoctor] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const data = await getDepartments();
        if (active) setDepartments(data);
      } catch {
        if (active) {
          setLoadError(true);
          toast.error("Bölümler yüklenemedi.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const openDepartment = async (dept) => {
    setSelected(dept);
    setDoctors([]);
    setDoctorsLoading(true);
    try {
      const data = await getDoctorsByDepartment(dept.id);
      setDoctors(data);
    } catch {
      toast.error("Doktorlar yüklenemedi.");
      setSelected(null); // hata: modalı kapat
    } finally {
      setDoctorsLoading(false);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* İçerik */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Bölümler</h1>
        <p className="mt-1 text-slate-500">Randevu almak için bir bölüm seçin.</p>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" /> Bölümler yükleniyor…
          </div>
        )}

        {!loading && loadError && (
          <p className="py-20 text-center text-slate-500">Bölümler yüklenemedi. Lütfen sayfayı yenileyin.</p>
        )}

        {!loading && !loadError && departments.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-slate-500">Henüz bölüm bulunmuyor.</p>
            <p className="mt-1 text-sm text-slate-400">Bölümler eklendiğinde burada görünecek.</p>
          </div>
        )}

        {!loading && !loadError && departments.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <DepartmentCard key={d.id} department={d} onClick={() => openDepartment(d)} />
            ))}
          </div>
        )}
      </main>

      {/* Doktor modalı */}
      {selected && (
        <DoctorModal
          department={selected}
          doctors={doctors}
          loading={doctorsLoading}
          onClose={() => setSelected(null)}
          onBook={(doctor) => {
            setSelected(null); // doktor listesini kapat
            setBookingDoctor(doctor); // randevu modalını aç
          }}
        />
      )}

      {/* Randevu alma modalı */}
      {bookingDoctor && (
        <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />
      )}
    </div>
  );
}
