# API Contract: Hastane Randevu Sistemi (MVP)

REST API sözleşmesi. Taban yol: `/api`. Tüm istek/yanıt gövdeleri JSON'dur. Korumalı uçlar
`Authorization: Bearer <JWT>` başlığı ister. Hata cevapları daima `{ "error": "<mesaj>" }`
biçimindedir ve uygun HTTP durum koduyla döner.

## Kimlik Doğrulama

### POST /api/auth/register
Yeni hasta hesabı oluşturur.

- **Auth**: Yok
- **Request**: `{ "name": string, "email": string, "password": string }`
- **201**: `{ "token": string, "user": { "id", "name", "email", "role": "HASTA" } }`
- **400**: eksik/geçersiz alan → `{ "error": "..." }`
- **409**: e-posta zaten kayıtlı → `{ "error": "Bu e-posta zaten kayıtlı" }`

### POST /api/auth/login
Kimlik doğrular ve JWT döner.

- **Auth**: Yok
- **Request**: `{ "email": string, "password": string }`
- **200**: `{ "token": string, "user": { "id", "name", "email", "role" } }`
- **400**: eksik alan
- **401**: geçersiz kimlik → `{ "error": "Geçersiz e-posta veya parola" }`

## Bölümler

### GET /api/departments
Tüm bölümleri listeler.

- **Auth**: Yok (veya Bearer — proje kararına göre; MVP'de açık)
- **200**: `[ { "id", "name", "description" } ]`

## Doktorlar

### GET /api/doctors
Doktorları listeler; `departmentId` ile filtrelenebilir.

- **Auth**: Yok
- **Query**: `departmentId` (opsiyonel)
- **200**: `[ { "id", "title", "user": { "id", "name" }, "department": { "id", "name" } } ]`

## Randevular

### GET /api/appointments/available
Bir doktor ve tarih için boş 30 dk slotları döner.

- **Auth**: Bearer (HASTA)
- **Query**: `doctorId` (zorunlu), `date` (zorunlu, "YYYY-MM-DD")
- **200**: `{ "date": "YYYY-MM-DD", "doctorId": number, "availableSlots": ["09:00","09:30", ...] }`
  - Dolu (AKTIF randevusu olan) slotlar çıkarılır.
  - `date` bugünse, o an itibarıyla geçmiş slotlar çıkarılır.
- **400**: eksik/geçersiz parametre (ör. geçmiş tarih)

### POST /api/appointments
Yeni randevu oluşturur (AKTIF).

- **Auth**: Bearer (HASTA)
- **Request**: `{ "doctorId": number, "date": "YYYY-MM-DD", "timeSlot": "HH:mm" }`
- **201**: `{ "id", "doctorId", "patientId", "date", "timeSlot", "status": "AKTIF" }`
- **400**: geçersiz slot / geçmiş tarih-saat → `{ "error": "..." }`
- **401**: token yok/geçersiz
- **409**: slot dolu (doktor) veya hasta aynı slotta zaten randevulu →
  `{ "error": "Bu saat dilimi uygun değil" }`

### DELETE /api/appointments/:id
Hastanın kendi randevusunu iptal eder (status → IPTAL).

- **Auth**: Bearer (HASTA, randevunun sahibi)
- **Path**: `id` (randevu id)
- **200**: `{ "id", "status": "IPTAL" }`
- **401**: token yok/geçersiz
- **403**: başka hastanın randevusu → `{ "error": "Bu randevuyu iptal etme yetkiniz yok" }`
- **404**: randevu bulunamadı

### GET /api/appointments/me
Giriş yapmış hastanın kendi AKTIF randevuları.

- **Auth**: Bearer (HASTA)
- **200**: `[ { "id", "date", "timeSlot", "status", "doctor": { "id", "title", "user": {"name"}, "department": {"name"} } } ]`

### GET /api/appointments/doctor
Giriş yapmış doktorun kendisine atanmış randevuları (tarih+saate göre sıralı ajanda).

- **Auth**: Bearer (DOKTOR)
- **200**: `[ { "id", "date", "timeSlot", "status", "patient": { "id", "name" } } ]`
- **403**: rol DOKTOR değilse

## Ortak Hata Kodları

| Kod | Anlam |
|-----|-------|
| 400 | Geçersiz/eksik girdi, iş kuralı ihlali (geçmiş tarih, geçersiz slot) |
| 401 | Kimlik doğrulanmadı (token yok/geçersiz) |
| 403 | Yetkisiz (rol/sahiplik uyuşmuyor) |
| 404 | Kaynak bulunamadı |
| 409 | Çakışma (dolu slot, çift randevu, kayıtlı e-posta) |
| 500 | Beklenmeyen sunucu hatası (genel güvenli mesaj; detay sızdırılmaz) |
