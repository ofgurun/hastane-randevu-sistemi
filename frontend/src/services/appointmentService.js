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
