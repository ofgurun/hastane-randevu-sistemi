// Auth Routes — /api/auth altındaki uçlar
// Gün 2: register ve login endpoint'leri
// Profil: me / profile / password (giriş gerektirir)

const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword } = require("../controllers/authController");
const { getMe, updateProfile, changePassword } = require("../controllers/profileController");
const { authenticate } = require("../middlewares/authMiddleware");

// POST /api/auth/register — Yeni kullanıcı kaydı
router.post("/register", register);

// POST /api/auth/login — Kullanıcı girişi
router.post("/login", login);

// POST /api/auth/forgot-password — Sıfırlama bağlantısı e-postası gönder
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password — Token ile yeni şifre belirle
router.post("/reset-password", resetPassword);

// GET   /api/auth/me — Giriş yapan kullanıcının profili
router.get("/me", authenticate, getMe);

// PATCH /api/auth/profile — Ad + kişisel bilgileri güncelle
router.patch("/profile", authenticate, updateProfile);

// PATCH /api/auth/password — Şifre değiştir (mevcut şifre doğrulamasıyla)
router.patch("/password", authenticate, changePassword);

module.exports = router;
