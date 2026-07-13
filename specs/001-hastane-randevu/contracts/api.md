# API Contract: Hastane Randevu Sistemi (MVP)

REST API sözleşmesi. Taban yol: `/api`. Tüm istek/yanıt gövdeleri JSON'dur. Korumalı uçlar
`Authorization: Bearer <JWT>` başlığı ister.

**Standart yanıt formatı** (tüm uçlar):

- Başarılı: `{ "success": true, "message"?: string, "data": <payload> }`
- Hatalı: `{ "success": false, "message": string }` (uygun HTTP durum koduyla; ham hata sızdırılmaz)

## Kimlik Doğrulama

### POST /api/auth/register
Yeni hasta hesabı oluşturur. **Güvenlik:** `role` istemciden alınmaz; her zaman `HASTA`.

- **Auth**: Yok
- **Request**: `{ "name": string, "email": string, "password": string }`
- **201**: `{ success, message, data: { user: { id, name, email, role: "HASTA" }, token } }`
- **400**: eksik/geçersiz alan
- **409**: e-posta zaten kayıtlı

### POST /api/auth/login
Kimlik doğrular ve JWT döner.

- **Auth**: Yok
- **Request**: `{ "email": string, "password": string }`
- **200**: `{ success, message, data: { user: { id, name, email, role }, token } }`
- **400**: eksik alan
- **401**: geçersiz kimlik ("E-posta veya şifre hatalı.")

## Bölümler

### GET /api/departments
Tüm bölümleri listeler.

- **Auth**: Yok (açık)
- **200**: `{ success, data: [ { id, name, description } ] }`

### POST /api/departments
Yeni bölüm oluşturur. **Yalnızca ADMIN.**

- **Auth**: Bearer (ADMIN)
- **Request**: `{ "name": string, "description"?: string }`
- **201**: `{ success, message, data: { id, name, description } }`
- **400**: `name` eksik · **401**: token yok · **403**: ADMIN değil · **409**: aynı isimde bölüm var

## Doktorlar

### GET /api/doctors
Doktorları listeler; `departmentId` ile filtrelenebilir.

- **Auth**: Yok (açık)
- **Query**: `departmentId` (opsiyonel)
- **200**: `{ success, data: [ { id, title, user: { id, name, email }, department: { id, name } } ] }`

### POST /api/doctors
Yeni doktor profili oluşturur. **Yalnızca ADMIN.**

- **Auth**: Bearer (ADMIN)
- **Request**: `{ "userId": number, "departmentId": number, "title": string }`
- **201**: `{ success, message, data: { doctor } }`
- **400**: eksik alan / kullanıcı DOKTOR değil · **401**: token yok · **403**: ADMIN değil
- **404**: user/department yok · **409**: bu kullanıcı için doktor profili zaten var

## Randevular

### GET /api/appointments/available
Bir doktor ve tarih için boş 30 dk slotları döner.

- **Auth**: Bearer
- **Query**: `doctorId` (zorunlu), `date` (zorunlu, "YYYY-MM-DD")
- **200**: `{ success, data: ["09:00","09:30", ...] }`
  - Yalnızca `status = AKTIF` randevusu olan slotlar çıkarılır (IPTAL boşa çıkar).
  - `date` bugünse, o an itibarıyla geçmiş/başlamış slotlar çıkarılır.
- **400**: eksik/geçersiz parametre · **401**: token yok · **404**: doktor yok

### POST /api/appointments
Yeni randevu oluşturur (AKTIF). Hasta, token'daki ID'dir. Başarıda hastaya onay e-postası
gönderilir (best-effort).

- **Auth**: Bearer (HASTA)
- **Request**: `{ "doctorId": number, "date": "YYYY-MM-DD", "timeSlot": "HH:mm" }`
- **201**: `{ success, message, data: { appointment } }`
- **400**: geçersiz slot / geçmiş tarih-saat · **401**: token yok · **404**: doktor yok
- **409**: slot dolu (doktorda o slot AKTIF) **veya** hastanın o gün zaten bir AKTIF randevusu var

### DELETE /api/appointments/:id
Randevuyu iptal eder (status → IPTAL, satır silinmez). İptalde hastaya bilgi e-postası
gönderilir (best-effort).

- **Auth**: Bearer (randevunun **sahibi hasta** veya **ADMIN**)
- **Path**: `id` (randevu id)
- **200**: `{ success, message, data: { id, status: "IPTAL" } }`
- **400**: randevu zaten IPTAL · **401**: token yok · **403**: sahibi değil ve ADMIN değil
- **404**: randevu bulunamadı

### GET /api/appointments/me
Giriş yapmış hastanın kendi AKTIF randevuları.

- **Auth**: Bearer (HASTA)
- **200**: `{ success, data: [ { id, date, timeSlot, status, doctor: { id, title, user: {name}, department: {name} } } ] }`

### GET /api/appointments/doctor
Giriş yapmış doktorun kendisine atanmış randevuları (tarih+saate göre sıralı ajanda).

- **Auth**: Bearer (DOKTOR)
- **200**: `{ success, data: [ { id, date, timeSlot, status, patient: { id, name } } ] }`
- **403**: rol DOKTOR değil

## Değerlendirmeler (Review)

### POST /api/reviews
Hasta, geçmişte gerçekleşmiş ve iptal edilmemiş kendi randevusu için doktora puan/yorum bırakır.

- **Auth**: Bearer (HASTA — randevunun sahibi)
- **Request**: `{ "appointmentId": number, "rating": 1..5, "comment": string }`
- **201**: `{ success, message, data: { review } }`
- **400**: rating 1–5 dışı / eksik alan / randevu henüz gerçekleşmemiş (gelecek tarih) / randevu IPTAL
- **401**: token yok · **403**: randevu bu hastaya ait değil · **404**: randevu yok
- **409**: bu randevu için zaten bir değerlendirme var

## Ortak Hata Kodları

| Kod | Anlam |
|-----|-------|
| 400 | Geçersiz/eksik girdi, iş kuralı ihlali (geçmiş/gelecek tarih, geçersiz slot/rating) |
| 401 | Kimlik doğrulanmadı (token yok/geçersiz) |
| 403 | Yetkisiz (rol/sahiplik uyuşmuyor) |
| 404 | Kaynak bulunamadı |
| 409 | Çakışma (dolu slot, günde ikinci randevu, kayıtlı e-posta, tekrar değerlendirme) |
| 500 | Beklenmeyen sunucu hatası (genel güvenli mesaj; detay sızdırılmaz) |
