// Merkezi hata yönetimi middleware'leri
// Constitution İlke III: JSON hata cevabı, tutarlı { success, message } formatı,
// ham hata/stack detayı istemciye sızdırılmaz.

// Tanımlı olmayan route'lar için JSON 404
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "İstenen kaynak bulunamadı.",
  });
};

// Yakalanmamış hataları toparlayan son savunma hattı (4 argümanlı imza).
// Controller'lar kendi try-catch'leriyle hata döndürür; buraya yalnızca
// beklenmeyen/iletilen (next(err)) hatalar düşer.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error("Beklenmeyen hata:", err);

  const status = err.status || 500;
  const message =
    status === 500 ? "Sunucu hatası. Lütfen daha sonra tekrar deneyin." : err.message;

  res.status(status).json({
    success: false,
    message,
  });
};

module.exports = { notFound, errorHandler };
