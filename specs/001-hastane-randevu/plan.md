# Implementation Plan: Hastane Randevu Sistemi (MVP)

**Branch**: `001-hastane-randevu` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-hastane-randevu/spec.md`

## Summary

15 iş günlük staj kapsamında, MVP seviyesinde bir Hastane Randevu Sistemi geliştirilecektir.
Sistem iki kökten oluşur: bir Express.js REST API (backend) ve bir React/Vite SPA (frontend).
Hastalar kayıt/giriş yapar, bölüm ve doktor seçer, bir tarih için hesaplanan boş 30 dakikalık
slotlardan randevu alır ve kendi randevularını görüntüleyip iptal eder; doktorlar kendi
randevu ajandalarını görür. İş kuralları (30 dk slotlar 09:00–16:30, hasta/doktor için aynı
slotta tek AKTIF randevu, geçmiş tarihe randevu yasağı, iptalde slotun anında boşa çıkması)
API katmanında zorlanır.

## Technical Context

**Language/Version**: JavaScript (Node.js 20 LTS, ESM/CommonJS) — Backend; JavaScript/JSX
(React 18) — Frontend

**Primary Dependencies**:
- Backend: Express.js, Prisma ORM, jsonwebtoken (JWT), bcryptjs, cors, dotenv
- Frontend: React (Vite), React Router, Zustand, Axios, MUI (varsayılan UI kütüphanesi)

**Storage**: İlişkisel veritabanı — PostgreSQL (varsayılan) veya MySQL, Prisma ORM üzerinden

**Testing**: Manuel/HTTP tabanlı uç doğrulama (curl/REST client) + quickstart senaryoları;
otomatik test paketi MVP kapsamı dışıdır (bkz. Complexity/Assumptions)

**Target Platform**: Linux/local sunucu (backend), modern masaüstü web tarayıcısı (frontend)

**Project Type**: Web application (ayrı backend + frontend kökleri)

**Performance Goals**: Boş slot listesi algılanan gecikme < 1 sn (SC-002); MVP ölçeğinde
eşzamanlılık düşük (tekil demo/sunum ortamı)

**Constraints**: 30 dakikalık sabit slotlar (09:00–16:30, mesai 09:00–17:00); parolalar
yalnızca hash olarak saklanır; iş kuralı ihlalleri JSON hata cevaplarıyla döner; ham hata
detayı istemciye sızdırılmaz

**Scale/Scope**: ~9 REST ucu, ~6 frontend sayfası, 4 veri modeli; seed verisi 5 bölüm,
10 doktor ve örnek randevular

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| İlke | Durum | Notlar |
|------|-------|--------|
| I. Sadece İsteneni Yap | ✅ PASS | Plan yalnızca spec'teki MVP uçlarını/ekranlarını içerir; kapsam dışı özellikler (ödeme, bildirim, erteleme, admin CRUD, raporlama) hariç tutuldu. |
| II. Modüler Kod | ✅ PASS | Backend `routes/controllers/middlewares/models/utils`, frontend `pages/components/services/store` olarak ayrıldı. |
| III. Hata Yönetimi | ✅ PASS | Tüm uçlar try-catch + merkezi error middleware; JSON hata cevabı ve uygun 4xx/5xx kodları. |
| IV. Adım Adım İlerle | ✅ PASS | Tasks fazı 15 günlük plana sadık, gün-gün ve backend→frontend→cila sırasıyla üretilecek. |
| Teknoloji Yığını | ✅ PASS | Node/Express/Prisma/React/Vite/Zustand/Axios/JWT/bcryptjs anayasadaki yığınla birebir. |

**Sonuç**: İhlal yok; gate geçildi. Post-design tekrar değerlendirmesi de aynı tabloyu korur.

## Project Structure

### Documentation (this feature)

```text
specs/001-hastane-randevu/
├── plan.md              # Bu dosya (/speckit-plan çıktısı)
├── research.md          # Faz 0 çıktısı
├── data-model.md        # Faz 1 çıktısı
├── quickstart.md        # Faz 1 çıktısı
├── contracts/           # Faz 1 çıktısı (REST API sözleşmesi)
│   └── api.md
├── checklists/
│   └── requirements.md  # Spec kalite kontrol listesi
└── tasks.md             # Faz 2 çıktısı (/speckit-tasks — bu komut üretmez)
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   ├── schema.prisma          # User, Department, Doctor, Appointment modelleri
│   └── seed.js                # 5 bölüm, 10 doktor, örnek randevular
├── src/
│   ├── index.js               # Express app girişi
│   ├── routes/                # authRoutes, departmentRoutes, doctorRoutes, appointmentRoutes
│   ├── controllers/           # auth, department, doctor, appointment controller'ları
│   ├── middlewares/           # authMiddleware (JWT doğrulama), errorHandler
│   ├── models/                # Prisma client örneği ve veri erişim yardımcıları
│   └── utils/                 # slot hesaplama (generateSlots, isPastSlot), token yardımcıları
├── .env.example               # DATABASE_URL, JWT_SECRET, PORT
└── package.json

frontend/
├── src/
│   ├── main.jsx               # React/Vite girişi
│   ├── App.jsx                # Router ve layout
│   ├── router/                # route tanımları + ProtectedRoute
│   ├── pages/                 # Login, Register, Home, RandevuAl, Randevularim, DoktorAjanda
│   ├── components/            # ortak UI, DateSelector, SlotList, Toast/bildirim
│   ├── services/              # axios instance + interceptor, auth/department/doctor/appointment API çağrıları
│   └── store/                 # Zustand auth store (JWT localStorage)
├── index.html
├── vite.config.js
└── package.json
```

**Structure Decision**: Web application yapısı (Option 2) seçildi. Backend ve frontend
bağımsız kökler olarak konumlanır; her biri kendi `package.json` dosyasına sahiptir. Bu
ayrım, anayasadaki Modüler Kod ilkesini ve 15 günlük planın backend-önce (Gün 1–5) sonra
frontend (Gün 6–10) akışını doğrudan destekler.

## Complexity Tracking

> Constitution Check ihlali yoktur; bu bölüm bilgi amaçlıdır.

| Karar | Gerekçe | Reddedilen basit alternatif |
|-------|---------|------------------------------|
| Otomatik test paketi (unit/integration) MVP dışı bırakıldı | 15 iş günü kısıtı; anayasa "Sadece İsteneni Yap" — plan otomatik test istemiyor | Doğrulama, quickstart senaryoları ve manuel HTTP testleriyle yapılır; ilerleyen sürümde eklenebilir |
| `date` + `timeSlot` string slotu (karmaşık zaman aralığı motoru yerine) | Sabit 30 dk slot kümesi yeterli; basit ve okunabilir | Doktora özel çalışma saatleri/mola motoru gereksiz karmaşıklık getirir, kapsam dışı |
