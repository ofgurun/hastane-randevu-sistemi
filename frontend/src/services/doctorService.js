import api from "./api";

// Belirli bir bölüme ait doktorları getirir.
// → [{ id, title, user: { id, name, email }, department: { id, name },
//      averageRating: 4.8 | null, reviewCount: 12 }]
export async function getDoctorsByDepartment(departmentId) {
  const res = await api.get("/doctors", { params: { departmentId } });
  return res.data.data;
}

// Doktorun aylık doluluk özeti (hasta takvimi için).
// → { month: "YYYY-MM", days: [{ date, totalSlots, availableCount, dayClosed }] }
export async function getDoctorAvailability(doctorId, month) {
  const res = await api.get(`/doctors/${doctorId}/availability`, { params: { month } });
  return res.data.data;
}

// Tüm doktorlar (admin listesi için).
export async function getAllDoctors() {
  const res = await api.get("/doctors");
  return res.data.data;
}

// Yeni doktor oluşturur (ADMIN): { name, email, password, title, departmentId, backupDoctorId? }
export async function createDoctor(data) {
  const res = await api.post("/doctors", data);
  return res.data.data;
}

// Doktoru tamamen kaldırır (ADMIN); aktif randevuları yedeğe aktarılır.
// → { id, transferred, cancelled }
export async function deleteDoctor(id) {
  const res = await api.delete(`/admin/doctors/${id}`);
  return res.data.data;
}

// Doktoru izne ayırır (ADMIN): tarih aralığındaki günler kapatılır,
// AKTIF randevular yedeğe aktarılır. → { blockedDays, transferred, cancelled }
export async function setDoctorLeave(id, startDate, endDate) {
  const res = await api.post(`/admin/doctors/${id}/leave`, { startDate, endDate });
  return res.data.data;
}
