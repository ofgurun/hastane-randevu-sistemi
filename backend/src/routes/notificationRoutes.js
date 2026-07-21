// Notification Routes — /api/notifications (tümü authenticate arkasında)
// Kullanıcı yalnızca kendi bildirimlerini listeler/yönetir (rol bağımsız).

const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");
const { authenticate } = require("../middlewares/authMiddleware");

// GET /api/notifications?limit=20&unread=1 — liste + okunmamış sayısı
router.get("/", authenticate, getMyNotifications);

// GET /api/notifications/unread-count — hafif polling ucu
router.get("/unread-count", authenticate, getUnreadCount);

// PATCH /api/notifications/read-all — tümünü okundu işaretle
router.patch("/read-all", authenticate, markAllRead);

// PATCH /api/notifications/:id/read — tek bildirimi okundu işaretle
router.patch("/:id/read", authenticate, markRead);

module.exports = router;
