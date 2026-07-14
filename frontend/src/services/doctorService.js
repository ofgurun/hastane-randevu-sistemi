import api from "./api";

// Belirli bir bölüme ait doktorları getirir.
// → [{ id, title, user: { id, name, email }, department: { id, name } }]
export async function getDoctorsByDepartment(departmentId) {
  const res = await api.get("/doctors", { params: { departmentId } });
  return res.data.data;
}
