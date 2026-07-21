import api from "./api";

// Admin istatistik paneli verileri
// → { totals, rates, occupancy, statusBreakdown, trend, byDepartment, byDoctor }
export async function getAdminStats() {
  const res = await api.get("/admin/stats");
  return res.data.data;
}
