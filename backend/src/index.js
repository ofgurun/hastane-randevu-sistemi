// Hastane Randevu Sistemi (MVP) — Express uygulama girişi
// Gün 1: temel sunucu kurulumu (cors, json, /api taban router'ı, sağlık kontrolü).
// Gün 2: auth route'ları eklendi (/api/auth/register, /api/auth/login).
// Gün 3: department ve doctor route'ları eklendi.
// Gün 4: appointment route'ları (boş slotlar) + merkezi hata yakalayıcılar eklendi.

require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Route modülleri
const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// Merkezi hata yönetimi
const { notFound, errorHandler } = require("./middlewares/errorHandler");

// Randevu hatırlatma cron görevi
const { startReminderCron } = require("./utils/cron");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// /api taban router'ı
const apiRouter = express.Router();

// Sağlık kontrolü — sunucunun ayakta olduğunu doğrular
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", service: "hastane-randevu-api" });
});

// Route mount'ları
apiRouter.use("/auth", authRoutes);
apiRouter.use("/departments", departmentRoutes);
apiRouter.use("/doctors", doctorRoutes);
apiRouter.use("/appointments", appointmentRoutes);
apiRouter.use("/reviews", reviewRoutes);

app.use("/api", apiRouter);

// Tanımlı olmayan route'lar için JSON 404 (tüm route'lardan sonra)
app.use(notFound);

// Merkezi hata yakalayıcı (en son middleware)
app.use(errorHandler);

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor — http://localhost:${PORT}/api/health`);
  // Randevu hatırlatma görevini başlat
  startReminderCron();
});

module.exports = app;
