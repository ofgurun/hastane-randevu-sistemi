// Review Routes — /api/reviews altındaki uçlar
// Gün 5: POST / — hasta değerlendirmesi (kimlik doğrulaması gerekli)

const express = require("express");
const router = express.Router();
const { createReview } = require("../controllers/reviewController");
const { authenticate } = require("../middlewares/authMiddleware");

// POST /api/reviews — geçmiş randevu için puan + yorum
router.post("/", authenticate, createReview);

module.exports = router;
