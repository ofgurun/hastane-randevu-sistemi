import api from "./api";

// Tüm bölümleri getirir → [{ id, name, description }]
export async function getDepartments() {
  const res = await api.get("/departments");
  return res.data.data;
}

// Yeni bölüm oluşturur (ADMIN) → oluşan bölüm { id, name, description }
export async function createDepartment(data) {
  const res = await api.post("/departments", data);
  return res.data.data;
}

// Bölüm başına önümüzdeki 30 günün boş slot özeti
// → [{ id, availableCount, nextSlot: { date, time } | null }]
export async function getDepartmentAvailabilitySummary() {
  const res = await api.get("/departments/availability-summary");
  return res.data.data;
}
