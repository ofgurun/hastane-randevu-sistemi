import api from "./api";

// Bildirim listesi + okunmamış sayısı → { items: [...], unreadCount }
export async function getNotifications(limit = 20) {
  const res = await api.get("/notifications", { params: { limit } });
  return res.data.data;
}

// Hafif polling ucu → { unreadCount }
export async function getUnreadCount() {
  const res = await api.get("/notifications/unread-count");
  return res.data.data.unreadCount;
}

// Tek bildirimi okundu işaretle
export async function markNotificationRead(id) {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
}

// Tüm bildirimleri okundu işaretle
export async function markAllNotificationsRead() {
  const res = await api.patch("/notifications/read-all");
  return res.data;
}
