// Auth Routes — /api/auth altındaki uçlar
// Gün 2: register ve login endpoint'leri

const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

// POST /api/auth/register — Yeni kullanıcı kaydı
router.post("/register", register);

// POST /api/auth/login — Kullanıcı girişi
router.post("/login", login);

module.exports = router;
