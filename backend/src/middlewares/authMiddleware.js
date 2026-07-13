// Auth Middleware — JWT doğrulama
// İsteklerdeki Authorization header'ından token'ı doğrular
// ve req.user'a decoded payload'ı ekler.

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Yetkilendirme token'ı bulunamadı.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Doğrulanmış kullanıcı bilgisini isteğe ekle
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Geçersiz veya süresi dolmuş token.",
    });
  }
};

module.exports = { authenticate };
