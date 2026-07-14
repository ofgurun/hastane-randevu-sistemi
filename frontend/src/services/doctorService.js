import api from "./api";

// Belirli bir bölüme ait doktorları getirir.
// → [{ id, title, user: { id, name, email }, department: { id, name } }]
export async function getDoctorsByDepartment(departmentId) {
  const res = await api.get("/doctors", { params: { departmentId } });
  return res.data.data;
}

// Tüm doktorlar (admin listesi için).
export async function getAllDoctors() {
  const res = await api.get("/doctors");
  return res.data.data;
}

// Yeni doktor oluşturur (ADMIN): { name, email, password, title, departmentId }
export async function createDoctor(data) {
  const res = await api.post("/doctors", data);
  return res.data.data;
}
