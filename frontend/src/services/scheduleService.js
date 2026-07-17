import api from "./api";

// Doktorun ay takvimi (ADMIN) → { month, days: [{ date, appointmentCount, bookedSlots, blockedSlots, dayClosed, totalSlots }] }
export async function getDoctorCalendar(doctorId, month) {
  const res = await api.get(`/admin/doctors/${doctorId}/calendar`, { params: { month } });
  return res.data.data;
}

// Gün/saat kapat-aç (toggle, ADMIN). timeSlot verilmezse tüm gün.
// → { blocked, date, timeSlot }
export async function toggleBlock(doctorId, { date, timeSlot }) {
  const res = await api.post(`/admin/doctors/${doctorId}/blocks`, { date, timeSlot });
  return res.data.data;
}
