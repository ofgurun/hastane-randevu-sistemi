// Department Routes — /api/departments altındaki uçlar
// Gün 3: GET (listele) ve POST (oluştur)

const express = require("express");
const router = express.Router();
const {
  getAllDepartments,
  createDepartment,
} = require("../controllers/departmentController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// GET  /api/departments — Tüm bölümleri getir (açık)
router.get("/", getAllDepartments);

// POST /api/departments — Yeni bölüm ekle (yalnızca ADMIN)
router.post("/", authenticate, authorize("ADMIN"), createDepartment);

module.exports = router;
