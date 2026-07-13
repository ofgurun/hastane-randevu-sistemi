// Hastane Randevu Sistemi (MVP) — Express uygulama girişi
// Gün 1: temel sunucu kurulumu (cors, json, /api taban router'ı, sağlık kontrolü).
// Gün 2: auth route'ları eklendi (/api/auth/register, /api/auth/login).

require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Route modülleri
const authRoutes = require("./routes/authRoutes");

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

app.use("/api", apiRouter);

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor — http://localhost:${PORT}/api/health`);
});

module.exports = app;
