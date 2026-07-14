// Kullanıcının rolüne göre ana sayfa yolu.
export function homePathForRole(role) {
  if (role === "ADMIN") return "/admin";
  if (role === "DOKTOR") return "/doctor-dashboard";
  return "/";
}
