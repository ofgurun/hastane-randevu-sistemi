// Auth Controller — register & login işlemleri
// Gün 2: JWT token üretimi ve bcryptjs ile şifre hashleme

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../models/prismaClient");

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

// ────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Alan doğrulama
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Lütfen name, email ve password alanlarını doldurun.",
      });
    }

    // Aynı e-posta ile kayıt kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Bu e-posta adresi zaten kayıtlı.",
      });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Kullanıcıyı oluştur (varsayılan rol: HASTA)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "HASTA",
      },
    });

    // JWT token üret
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Kayıt başarılı.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Register hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Kayıt işlemi başarısız.",
    });
  }
};

// ────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Alan doğrulama
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Lütfen email ve password alanlarını doldurun.",
      });
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "E-posta veya şifre hatalı.",
      });
    }

    // Şifre doğrulama
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "E-posta veya şifre hatalı.",
      });
    }

    // JWT token üret
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Giriş başarılı.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Giriş işlemi başarısız.",
    });
  }
};

module.exports = { register, login };
