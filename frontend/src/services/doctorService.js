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

// Giriş yapan doktorun kendi aylık doluluk özeti (Takvimim görünümü).
export async function getMyAvailability(month) {
  const res = await api.get("/doctors/me/availability", { params: { month } });
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

// ── İzin talepleri ──

// İzin talebi oluşturur (DOKTOR) → oluşan talep. reason (açıklama) zorunlu.
export async function createLeaveRequest(startDate, endDate, reason) {
  const res = await api.post("/doctors/me/leave-requests", { startDate, endDate, reason });
  return res.data.data;
}

// Kendi izin taleplerim (DOKTOR) → [{ id, startDate, endDate, status, createdAt }]
export async function getMyLeaveRequests() {
  const res = await api.get("/doctors/me/leave-requests");
  return res.data.data;
}

// Tüm izin talepleri (ADMIN, bekleyenler önce) → doctor.user.name + department dahil
export async function getLeaveRequests() {
  const res = await api.get("/admin/leave-requests");
  return res.data.data;
}

// Talebi karara bağlar (ADMIN): action "approve" | "reject"
// → onayda { id, status, blockedDays, transferred, cancelled }
export async function decideLeaveRequest(id, action) {
  const res = await api.patch(`/admin/leave-requests/${id}`, { action });
  return res.data.data;
}
