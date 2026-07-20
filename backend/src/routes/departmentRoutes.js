// Department Routes — /api/departments altındaki uçlar
// Gün 3: GET (listele) ve POST (oluştur)

const express = require("express");
const router = express.Router();
const {
  getAllDepartments,
  createDepartment,
  getAvailabilitySummary,
} = require("../controllers/departmentController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// GET  /api/departments — Tüm bölümleri getir (açık)
router.get("/", getAllDepartments);

// GET  /api/departments/availability-summary — bölüm başına boş slot sayısı + en yakın slot (açık)
router.get("/availability-summary", getAvailabilitySummary);

// POST /api/departments — Yeni bölüm ekle (yalnızca ADMIN)
router.post("/", authenticate, authorize("ADMIN"), createDepartment);

module.exports = router;
