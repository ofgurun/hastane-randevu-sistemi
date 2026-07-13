# Quickstart & Validation Guide: Hastane Randevu Sistemi (MVP)

Bu belge, özelliğin uçtan uca çalıştığını doğrulamak için gereken kurulum ve senaryoları
tanımlar. Uygulama kodu detayları tasks.md ve uygulama fazına aittir; burada yalnızca
çalıştırma/doğrulama adımları vardır.

## Ön Koşullar

- Node.js 20 LTS ve npm
- Çalışan bir PostgreSQL (veya MySQL) örneği
- `backend/.env` içinde: `DATABASE_URL`, `JWT_SECRET`, `PORT`

## Kurulum

```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init     # şemayı uygula
npm run seed                            # 5 bölüm, 10 doktor, örnek randevular
npm run dev                             # API'yi başlat (varsayılan http://localhost:5000)

# Frontend (ayrı terminal)
cd frontend
npm install
npm run dev                             # SPA'yı başlat (varsayılan http://localhost:5173)
```

## Doğrulama Senaryoları

Aşağıdaki senaryolar spec'teki kabul kriterleriyle (US1–US3) eşleşir. HTTP çağrıları curl/REST
client ile, UI adımları tarayıcıdan doğrulanabilir.

### Senaryo 1 — Kayıt ve Giriş (US1, FR-001..FR-003)
1. `POST /api/auth/register` ile yeni hasta oluştur → 201 ve token döner.
2. `POST /api/auth/login` ile aynı bilgilerle giriş yap → 200 ve token döner.
3. Yanlış parola ile giriş → 401 `{ "error": "Geçersiz e-posta veya parola" }`.

### Senaryo 2 — Bölüm ve Doktor Listeleme (US1, FR-006..FR-007)
1. `GET /api/departments` → 5 bölüm döner.
2. `GET /api/doctors?departmentId=<id>` → yalnızca o bölümün doktorları döner.

### Senaryo 3 — Boş Slot Hesabı (US1, FR-008..FR-010)
1. `GET /api/appointments/available?doctorId=<id>&date=<gelecek-tarih>` (Bearer) →
   `availableSlots` içinde 09:00..16:30 arası dolu olmayan slotlar.
2. Bugünün tarihiyle çağır → şu andan önceki slotların listede olmadığını doğrula.

### Senaryo 4 — Randevu Oluşturma ve Çakışma (US1, FR-011..FR-014)
1. `POST /api/appointments` boş bir slotla → 201, status AKTIF.
2. Aynı doktor+tarih+slot için ikinci bir hasta → 409 (slot dolu).
3. Aynı hasta aynı tarih+slotta farklı doktora → 409 (hasta çakışması).
4. Geçmiş bir tarih/saat ile → 400.

### Senaryo 5 — Randevularım ve İptal (US2, FR-015..FR-017)
1. `GET /api/appointments/me` (Bearer, hasta) → yalnızca kendi AKTIF randevuları.
2. `DELETE /api/appointments/:id` (sahibi) → 200, status IPTAL.
3. İptal sonrası `GET /api/appointments/available` → iptal edilen slotun yeniden boş olduğunu
   doğrula.
4. Başka hastanın randevusunu iptal → 403.

### Senaryo 6 — Doktor Ajandası (US3, FR-018)
1. Doktor rolüyle giriş yap.
2. `GET /api/appointments/doctor` (Bearer, doktor) → yalnızca o doktorun randevuları,
   tarih+saate göre sıralı.
3. Hasta rolüyle bu uca istek → 403.

### UI Uçtan Uca (frontend)
1. Register/Login ekranından giriş yap; token localStorage'a yazılır, korumalı sayfalara
   erişilir.
2. Home'da bölüm→doktor seç; RandevuAl ekranında tarih seç, boş slottan randevu al; toast
   bildirimi görünür.
3. "Randevularım" ekranında randevuyu gör ve iptal et.
4. Doktor hesabıyla giriş yapıp ajanda ekranını gör.
5. Giriş yapmadan korumalı bir sayfaya git → login'e yönlendirilir (ProtectedRoute).

## Başarı Ölçütleriyle Eşleme

| Senaryo | İlgili Success Criteria |
|---------|--------------------------|
| 1, UI 1 | SC-001 (kayıt→randevu < 3 dk), SC-006 (yetki) |
| 3 | SC-002 (slotlar anında) |
| 4 | SC-003 (çift randevu %100 reddedilir), SC-005 (geçmiş reddedilir) |
| 5 | SC-004 (iptal edilen slot yeniden açılır), SC-006 |
| 6 | SC-006 (yalnızca kendi verisi) |
