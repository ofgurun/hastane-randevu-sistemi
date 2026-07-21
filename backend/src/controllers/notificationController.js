// Notification Controller — kullanıcının in-app bildirimleri (çan)
// Tüm uçlar authenticate arkasında; kullanıcı yalnızca kendi bildirimlerini görür/yönetir.

const prisma = require("../models/prismaClient");

// ────────────────────────────────────────────
// GET /api/notifications?limit=20&unread=1
// Son bildirimler (yeni→eski) + okunmamış sayısı.
// ────────────────────────────────────────────
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const onlyUnread = req.query.unread === "1" || req.query.unread === "true";

    const where = { userId };
    if (onlyUnread) where.readAt = null;

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return res.status(200).json({ success: true, data: { items, unreadCount } });
  } catch (error) {
    console.error("Bildirim listeleme hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Bildirimler getirilemedi." });
  }
};

// ────────────────────────────────────────────
// GET /api/notifications/unread-count — hafif polling ucu
// ────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, readAt: null },
    });
    return res.status(200).json({ success: true, data: { unreadCount } });
  } catch (error) {
    console.error("Okunmamış sayısı hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
};

// ────────────────────────────────────────────
// PATCH /api/notifications/:id/read — tek bildirimi okundu işaretle
// ────────────────────────────────────────────
const markRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Geçersiz bildirim id." });
    }
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Bildirim bulunamadı." });
    }
    if (!notification.readAt) {
      await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    }
    return res.status(200).json({ success: true, message: "Bildirim okundu olarak işaretlendi." });
  } catch (error) {
    console.error("Bildirim okundu işaretleme hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
};

// ────────────────────────────────────────────
// PATCH /api/notifications/read-all — tümünü okundu işaretle
// ────────────────────────────────────────────
const markAllRead = async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return res.status(200).json({ success: true, message: "Tüm bildirimler okundu.", data: { updated: result.count } });
  } catch (error) {
    console.error("Tümünü okundu işaretleme hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
};

module.exports = { getMyNotifications, getUnreadCount, markRead, markAllRead };
