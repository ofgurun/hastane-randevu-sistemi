// Auth Controller — register & login işlemleri
// Gün 2: JWT token üretimi ve bcryptjs ile şifre hashleme

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../models/prismaClient");
const email = require("../utils/email");

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Frontend taban adresi — sıfırlama linki bununla kurulur (Vite dev varsayılanı 5173).
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

    // Kullanıcıyı oluştur — güvenlik: rol istemciden ALINMAZ, her zaman HASTA.
    // DOKTOR/ADMIN rolleri yalnızca seed veya yetkili işlemlerle atanır.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "HASTA",
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
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
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
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Giriş işlemi başarısız.",
    });
  }
};

// ────────────────────────────────────────────
// POST /api/auth/forgot-password  { email }
// Güvenlik: e-posta kayıtlı olsun olmasın aynı yanıt döner (kullanıcı sızdırılmaz).
// Kayıtlıysa tek kullanımlık, 1 saat geçerli token üretilip e-postayla gönderilir.
// ────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const GENERIC = {
    success: true,
    message: "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.",
  };
  try {
    const { email: rawEmail } = req.body;
    if (!rawEmail || !EMAIL_RE.test(rawEmail)) {
      return res.status(400).json({ success: false, message: "Geçerli bir e-posta adresi girin." });
    }

    const user = await prisma.user.findUnique({ where: { email: rawEmail } });
    if (!user) {
      // Kullanıcı yok — yine de generic yanıt (email enumeration önlemi).
      return res.status(200).json(GENERIC);
    }

    // Bu kullanıcının önceki kullanılmamış token'larını geçersiz kıl.
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
    try {
      await email.sendPasswordReset(user.email, user.name, resetUrl);
    } catch (mailErr) {
      console.error("Sıfırlama e-postası gönderilemedi:", mailErr.message);
    }

    return res.status(200).json(GENERIC);
  } catch (error) {
    console.error("Forgot-password hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. İşlem yapılamadı." });
  }
};

// ────────────────────────────────────────────
// POST /api/auth/reset-password  { token, newPassword }
// Token geçerli + süresi dolmamış + kullanılmamışsa şifreyi günceller (tek kullanımlık).
// ────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "token ve newPassword zorunludur." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Yeni şifre en az 6 karakter olmalıdır." });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: sha256(token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeniden talep edin.",
      });
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
    });
  } catch (error) {
    console.error("Reset-password hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. İşlem yapılamadı." });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
