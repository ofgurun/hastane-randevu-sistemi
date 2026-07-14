import api from "./api";

// Tüm bölümleri getirir → [{ id, name, description }]
export async function getDepartments() {
  const res = await api.get("/departments");
  return res.data.data;
}
