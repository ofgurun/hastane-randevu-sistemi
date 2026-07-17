import api from "./api";

// Bir doktor + tarih için boş 30 dk slotları getirir → ["09:00", "09:30", ...]
export async function getAvailableSlots(doctorId, date) {
  const res = await api.get("/appointments/available", { params: { doctorId, date } });
  return res.data.data;
}

// Yeni randevu oluşturur (hasta = token'daki kullanıcı) → oluşan randevu nesnesi
export async function createAppointment(doctorId, date, timeSlot) {
  const res = await api.post("/appointments", { doctorId, date, timeSlot });
  return res.data.data;
}

// Giriş yapan hastanın kendi AKTİF randevuları
// → [{ id, date, timeSlot, status, doctor: { title, user:{name}, department:{name} } }]
export async function getMyAppointments() {
  const res = await api.get("/appointments/me");
  return res.data.data;
}

// Randevuyu iptal eder (status → IPTAL) → { id, status }
export async function cancelAppointment(id) {
  const res = await api.delete(`/appointments/${id}`);
  return res.data.data;
}

// Randevuyu tamamlandı olarak işaretler (yalnızca randevunun doktoru) → { id, status }
export async function completeAppointment(id) {
  const res = await api.patch(`/appointments/${id}/complete`);
  return res.data.data;
}

// Giriş yapan doktorun kendi ajandası (AKTİF randevular, tarih+saate sıralı)
// → [{ id, date, timeSlot, status, patient: { id, name } }]
export async function getDoctorAppointments() {
  const res = await api.get("/appointments/doctor");
  return res.data.data;
}
