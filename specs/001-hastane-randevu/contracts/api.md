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

### GET /api/auth/me
Giriş yapan kullanıcının profili (şifre asla dönmez).

- **Auth**: Bearer
- **200**: `{ success, data: { id, name, email, role, phone, birthDate, gender, address } }` (profil alanları null olabilir)

### PATCH /api/auth/profile
Ad + kişisel bilgileri günceller.

- **Auth**: Bearer
- **Request**: `{ "name": string, "phone"?, "birthDate"? (YYYY-MM-DD), "gender"? ("KADIN"|"ERKEK"|"BELIRTILMEMIS"), "address"? }`
- **200**: `{ success, message, data: <profil> }` · **400**: boş ad / geçersiz cinsiyet / geçersiz tarih

### PATCH /api/auth/password
Mevcut şifre doğrulamasıyla şifre değiştirir.

- **Auth**: Bearer
- **Request**: `{ "currentPassword": string, "newPassword": string }` (yeni ≥6, mevcuttan farklı)
- **200**: `{ success, message }` · **400**: kısa/aynı şifre · **401**: mevcut şifre hatalı

### POST /api/auth/forgot-password
Şifre sıfırlama bağlantısı e-postası gönderir. **Güvenlik:** e-posta kayıtlı olsun olmasın
aynı yanıt döner (kullanıcı sızdırılmaz). Kayıtlıysa tek kullanımlık, 1 saat geçerli token üretilir.

- **Auth**: Yok
- **Request**: `{ "email": string }`
- **200**: `{ success: true, message }` (generic) · **400**: geçersiz e-posta formatı

### POST /api/auth/reset-password
Token ile yeni şifre belirler (tek kullanımlık; süresi dolmuş/kullanılmış token reddedilir).

- **Auth**: Yok
- **Request**: `{ "token": string, "newPassword": string }` (≥6)
- **200**: `{ success, message }` · **400**: eksik/kısa şifre, geçersiz/süresi dolmuş/kullanılmış token

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

### GET /api/departments/availability-summary
Her bölüm için önümüzdeki **30 gündeki** toplam boş slot sayısı ve **en yakın boş slot**
(hasta ana sayfasındaki bölüm kartları için). AKTIF randevular ve kapalı zamanlar düşülür;
bugün için geçmiş saatler hariç.

- **Auth**: Yok (açık)
- **200**: `{ success, data: [ { id, availableCount: number, nextSlot: { date: "YYYY-MM-DD", time: "HH:mm" } | null } ] }`
  - `availableCount` 0 ise (veya doktoru yoksa) `nextSlot` null → kart "Uygun randevu bulunamadı" gösterir.

## Doktorlar

### GET /api/doctors
Doktorları listeler; `departmentId` ile filtrelenebilir. Her kayıt, `Review` tablosundan
aggregate edilen **ortalama puanı** ve **değerlendirme sayısını** da içerir.

- **Auth**: Yok (açık)
- **Query**: `departmentId` (opsiyonel)
- **200**: `{ success, data: [ { id, title, user: { id, name, email }, department: { id, name }, averageRating: number|null, reviewCount: number } ] }`
  - `averageRating`: 1 ondalık yuvarlanmış (ör. 4.5); değerlendirme yoksa `null`, `reviewCount` 0.

### GET /api/doctors/:id/availability?month=YYYY-MM
Hasta takvimi için aylık **doluluk özeti**. Yalnızca sayısal özet döner — hangi saatlerin
dolu olduğu bu uçtan sızdırılmaz (saat listesi için `GET /api/appointments/available`).

- **Auth**: Yok (açık)
- **Query**: `month` (YYYY-MM, zorunlu)
- **200**: `{ success, data: { month, days: [ { date: "YYYY-MM-DD", totalSlots: 16, availableCount: number, dayClosed: boolean } ] } }`
  - `availableCount` = toplam slot − (AKTIF randevular ∪ kapalı saatler); gün komple kapalıysa 0.
- **400**: geçersiz id / month formatı · **404**: doktor yok

### GET /api/doctors/me/availability?month=YYYY-MM
Giriş yapan doktorun kendi aylık doluluk özeti (doktor paneli "Takvimim"). Hesap
yukarıdaki uçla birebir aynıdır; doktor token'dan çözülür.

- **Auth**: Bearer (DOKTOR)
- **200**: aynı şema · **400**: month formatı · **401**: token yok · **403**: DOKTOR değil · **404**: doktor profili yok

### POST /api/doctors
Yeni doktor oluşturur — DOKTOR `User` + `Doctor` profili tek **transaction**'da. **Yalnızca ADMIN.**

- **Auth**: Bearer (ADMIN)
- **Request**: `{ "name": string, "email": string, "password": string, "title": string, "departmentId": number, "backupDoctorId"?: number }`
  - `backupDoctorId` opsiyoneldir; verilirse **aynı bölümden** mevcut bir doktor olmalıdır (aksi 400).
- **201**: `{ success, message, data: { doctor + user{id,name,email} + department{id,name} } }`
- **400**: eksik alan / şifre < 6 / yedek farklı bölümden · **401**: token yok · **403**: ADMIN değil
- **404**: bölüm/yedek doktor yok · **409**: e-posta zaten kayıtlı

### POST /api/admin/doctors/:id/leave
Doktoru tarih aralığında izne ayırır. **Yalnızca ADMIN.** Aralıktaki günler tam-gün `TimeBlock`
ile kapatılır; aralıktaki AKTIF randevular **yedek doktora aktarılır** (yedek o gün+saatte doluysa
randevu IPTAL edilir).

- **Request**: `{ "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }` (ikisi de dahil)
- **200**: `{ success, message, data: { startDate, endDate, blockedDays, transferred, cancelled } }`
- **400**: geçersiz tarih / bitiş < başlangıç · **401/403**: yetki · **404**: doktor yok
- **409**: aralıkta AKTIF randevu var ama yedek doktor tanımlı değil

### DELETE /api/admin/doctors/:id
Doktoru tamamen kaldırır. **Yalnızca ADMIN.** Gelecek AKTIF randevular yedek doktora aktarılır
(çakışanlar IPTAL); ardından doktorun blok/randevu/değerlendirme kayıtları, profili ve kullanıcı
hesabı **transaction** içinde silinir. Bu doktoru yedek olarak kullananların referansı temizlenir.

- **200**: `{ success, message, data: { id, transferred, cancelled } }`
- **400**: geçersiz id · **401/403**: yetki · **404**: doktor yok
- **409**: gelecek AKTIF randevu var ama yedek doktor tanımlı değil

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

<!-- Not: DELETE /api/appointments/:id yetkisi genişletildi — randevunun doktoru da iptal edebilir. -->
### DELETE /api/appointments/:id
Randevuyu iptal eder (status → IPTAL, satır silinmez). İptalde hastaya bilgi e-postası
gönderilir (best-effort).

- **Auth**: Bearer (randevunun **sahibi hasta** veya **ADMIN**)
- **Path**: `id` (randevu id)
- **200**: `{ success, message, data: { id, status: "IPTAL" } }`
- **400**: randevu zaten IPTAL · **401**: token yok · **403**: sahibi değil ve ADMIN değil
- **404**: randevu bulunamadı

### PATCH /api/appointments/:id/complete
Randevuyu **TAMAMLANDI** olarak işaretler. Yalnızca randevunun doktoru; randevu AKTIF
olmalı ve saati başlamış olmalı (gelecekteki randevu tamamlanamaz).

- **Auth**: Bearer (DOKTOR — randevunun sahibi)
- **200**: `{ success, message, data: { id, status: "TAMAMLANDI" } }`
- **400**: geçersiz id / IPTAL / zaten TAMAMLANDI / henüz başlamamış · **403**: DOKTOR değil veya başkasının randevusu · **404**: randevu yok
- Not: TAMAMLANDI randevu **iptal edilemez** (DELETE → 400) ama hasta tarafından **değerlendirilebilir**.

### POST /api/doctors/me/leave-requests
Doktor kendine izin talebi oluşturur (admin onayına düşer, izin hemen uygulanmaz).

- **Auth**: Bearer (DOKTOR)
- **Request**: `{ "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "reason": string }` (tarihler dahil; reason zorunlu, ≤500 karakter, trim'lenir)
- **201**: `{ success, message, data: { id, doctorId, startDate, endDate, reason, status: "BEKLIYOR", createdAt } }`
- **400**: format / bitiş<başlangıç / geçmiş tarih / >366 gün / reason eksik veya >500 · **403**: DOKTOR değil
- **409**: BEKLIYOR **veya ONAYLANDI** taleple çakışma, ya da aralıktaki tüm günler zaten kapalı (admin doğrudan izne ayırmış)
- Not: listeleme uçları (`GET me/leave-requests`, `GET /admin/leave-requests`) `reason` alanını da döner.

### GET /api/doctors/me/leave-requests
Doktorun kendi izin talepleri (yeniden eskiye). — **Auth**: Bearer (DOKTOR)
- **200**: `{ success, data: [ { id, startDate, endDate, status: BEKLIYOR|ONAYLANDI|REDDEDILDI, createdAt, decidedAt } ] }`

### GET /api/admin/leave-requests
Tüm izin talepleri, bekleyenler önce. — **Auth**: Bearer (ADMIN)
- **200**: `{ success, data: [ { ..., doctor: { id, title, user{name}, department{name}, backupDoctor{user{name}}|null } } ] }`

### PATCH /api/admin/leave-requests/:id
Talebi karara bağlar. — **Auth**: Bearer (ADMIN)
- **Request**: `{ "action": "approve" | "reject" }`
- **200 (approve)**: izin uygulanır (günler TimeBlock ile kapatılır + AKTIF randevular yedeğe aktarılır) → `{ data: { id, status: "ONAYLANDI", blockedDays, transferred, cancelled } }`
- **200 (reject)**: `{ data: { id, status: "REDDEDILDI" } }`
- **400**: geçersiz action / zaten karara bağlanmış · **404**: talep yok
- **409 (approve)**: aralıkta AKTIF randevu var ama yedek doktor tanımsız — talep BEKLIYOR kalır

### GET /api/appointments/me
Giriş yapmış hastanın tüm randevuları (AKTIF + IPTAL), tarihe göre yeniden eskiye sıralı.

- **Auth**: Bearer (HASTA)
- **200**: `{ success, data: [ { id, date, timeSlot, status, doctor: { id, title, user: {name}, department: {name} } } ] }`

### GET /api/appointments/doctor
Giriş yapmış doktorun kendisine atanmış randevuları (tarih+saate göre sıralı ajanda).

- **Auth**: Bearer (DOKTOR)
- **200**: `{ success, data: [ { id, date, timeSlot, status, patient: { id, name } } ] }`
- **403**: rol DOKTOR değil

## Admin Takvim Yönetimi (TimeBlock)

### GET /api/admin/doctors/:id/calendar?month=YYYY-MM
Doktorun ay takvimi: her gün için doluluk ve kapalılık özeti. **Yalnızca ADMIN.**

- **Auth**: Bearer (ADMIN)
- **200**: `{ success, data: { month, days: [ { date, appointmentCount, bookedSlots, blockedSlots, dayClosed, totalSlots } ] } }`
- **400**: geçersiz month/id · **401/403**: yetki · **404**: doktor yok

### POST /api/admin/doctors/:id/blocks
Gün veya saat kapat/aç (**toggle**). `timeSlot` verilmezse tüm gün. **Yalnızca ADMIN.**

- **Auth**: Bearer (ADMIN)
- **Request**: `{ "date": "YYYY-MM-DD", "timeSlot"?: "HH:mm" }`
- **201** (kapatıldı) / **200** (açıldı): `{ success, message, data: { blocked, date, timeSlot } }`
- **400**: geçersiz tarih/slot · **401/403**: yetki · **404**: doktor yok

> Etki: kapatılan gün/saatler `GET /appointments/available` sonuçlarından çıkarılır ve
> `POST /appointments` bu slotları **409** ile reddeder.

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
