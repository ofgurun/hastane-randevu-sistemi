import api from "./api";

// Giriş yapan kullanıcının profili → { id, name, email, role, phone, birthDate, gender, address }
export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data.data;
}

// Ad + kişisel bilgileri güncelle → güncel profil
export async function updateProfile(data) {
  const res = await api.patch("/auth/profile", data);
  return res.data.data;
}

// Şifre değiştir → { success, message }
export async function changePassword(currentPassword, newPassword) {
  const res = await api.patch("/auth/password", { currentPassword, newPassword });
  return res.data;
}

// Şifremi unuttum — sıfırlama bağlantısı e-postası ister → { success, message }
export async function forgotPassword(email) {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
}

// Token ile yeni şifre belirle → { success, message }
export async function resetPassword(token, newPassword) {
  const res = await api.post("/auth/reset-password", { token, newPassword });
  return res.data;
}
