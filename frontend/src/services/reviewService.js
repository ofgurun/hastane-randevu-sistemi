import api from "./api";

// Geçmiş bir randevu için değerlendirme oluşturur → oluşan review nesnesi
export async function createReview(appointmentId, rating, comment) {
  const res = await api.post("/reviews", { appointmentId, rating, comment });
  return res.data.data;
}
