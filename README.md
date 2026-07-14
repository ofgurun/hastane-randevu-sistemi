# 🏥 MediRandevu — Hastane Randevu Sistemi

Modern, tam yığın (full-stack) bir **Hastane Randevu Sistemi**. Hastalar bölüm ve doktor
seçerek 30 dakikalık zaman dilimlerinde randevu alabilir, randevularını yönetebilir ve geçmiş
randevularını değerlendirebilir; doktorlar kendi ajandalarını görüntüleyebilir; adminler bölüm
ve doktor tanımlayabilir.

> MVP seviyesinde, Spec-Driven Development (Spec Kit) yaklaşımıyla 15 iş günlük bir staj
> projesi olarak geliştirilmiştir.

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Kullanılan Teknolojiler](#-kullanılan-teknolojiler)
- [Proje Yapısı](#-proje-yapısı)
- [Kurulum](#-kurulum)
- [Çalıştırma](#-çalıştırma)
- [Sunum İçin Test Hesapları](#-sunum-i̇çin-test-hesapları)
- [API Uçları](#-api-uçları)
- [İş Kuralları](#-i̇ş-kuralları)

---

## ✨ Özellikler

- 🔐 **Kimlik Doğrulama**: JWT tabanlı kayıt/giriş, rol bazlı erişim (HASTA / DOKTOR / ADMIN).
- 🏬 **Bölüm & Doktor Listeleme**: Bölümlere göre filtrelenebilir doktor listesi.
- 📅 **Randevu Motoru**: Bir doktor + tarih için boş 30 dk slotların (09:00–16:30) dinamik hesabı.
- ✅ **Randevu Al / İptal Et**: Çakışma ve geçmiş tarih kontrolleriyle güvenli randevu oluşturma; iptal edilen slot anında boşa çıkar.
- 🗂️ **Randevularım**: Aktif ve geçmiş (iptal dahil) randevuların listesi.
- ⭐ **Değerlendirme (Review)**: Geçmiş randevular için 1–5 yıldız + yorum.
- 👨‍⚕️ **Doktor Paneli**: Doktorun kendi randevu ajandası (salt-okunur).
- 🛡️ **Admin Paneli**: Bölüm ve doktor yönetimi (doktor kullanıcı + profili tek transaction'da).
- 📧 **E-posta Bildirimi**: Randevu oluşturma/iptalde bilgilendirme + **randevu öncesi hatırlatma** (node-cron, nodemailer + Ethereal).
- 🔒 **Merkezi Güvenlik**: `ProtectedRoute` ile rol bazlı sayfa koruması.
- 🔔 **Toast Bildirimleri** ve anlık form validasyonları.

---

## 🛠 Kullanılan Teknolojiler

### Frontend
| Teknoloji | Amaç |
|-----------|------|
| **React 19** (Vite) | SPA arayüz |
| **Tailwind CSS** | Utility-first stil |
| **React Router** | Yönlendirme + korumalı rotalar |
| **Zustand** (persist) | Global auth state |
| **Axios** | HTTP istemcisi (JWT interceptor) |
| **react-hot-toast** | Bildirimler |
| **lucide-react** | İkonlar |

### Backend
| Teknoloji | Amaç |
|-----------|------|
| **Node.js + Express** | REST API |
| **Prisma ORM** | Veri erişimi & migration |
| **Supabase PostgreSQL** | Veritabanı |
| **JWT (jsonwebtoken)** | Kimlik doğrulama |
| **bcryptjs** | Parola hash'leme |
| **nodemailer** | E-posta gönderimi |
| **node-cron** | Randevu hatırlatma zamanlayıcı |

---

## 📁 Proje Yapısı

```text
hastane-randevu-sistemi/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # User, Department, Doctor, Appointment, Review
│   │   ├── migrations/
│   │   └── seed.js            # Demo veri (5 bölüm, 10 doktor, 2 hasta)
│   └── src/
│       ├── controllers/       # auth, department, doctor, appointment, review
│       ├── routes/
│       ├── middlewares/       # authMiddleware (authenticate + authorize), errorHandler
│       ├── models/            # prismaClient
│       ├── utils/             # slots, email
│       └── index.js           # Express giriş noktası
└── frontend/
    └── src/
        ├── pages/             # Login, Register, Home, Appointments, DoctorDashboard
        ├── components/        # Navbar, ProtectedRoute, DepartmentCard, DoctorModal, BookingModal, ReviewModal ...
        ├── services/          # api (axios), department/doctor/appointment/review servisleri
        └── store/             # authStore (Zustand)
```

---

## 🚀 Kurulum

### Ön Koşullar
- **Node.js 20+** ve npm
- Bir **PostgreSQL** bağlantısı (Supabase önerilir)

### 1) Backend

```bash
cd backend
npm install
```

`backend/.env` dosyasını `.env.example`'ı örnek alarak oluşturun:

```bash
# Veritabanı (Supabase Postgres)
DATABASE_URL="postgresql://<user>:<password>@<host>:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://<user>:<password>@<host>:5432/postgres"

# Kimlik doğrulama
JWT_SECRET="güçlü-bir-gizli-anahtar"

# Sunucu
PORT=5000

# E-posta (test için Ethereal — https://ethereal.email)
EMAIL_HOST="smtp.ethereal.email"
EMAIL_PORT=587
EMAIL_USER="<ethereal-kullanıcı>"
EMAIL_PASS="<ethereal-parola>"
EMAIL_FROM="Hastane Randevu <no-reply@hastane.local>"
```

Veritabanı şemasını uygulayın ve demo veriyi yükleyin:

```bash
npx prisma migrate dev      # tabloları oluştur
npm run seed                # 5 bölüm, 10 doktor, 2 hasta + örnek randevular
```

### 2) Frontend

```bash
cd frontend
npm install
```

> Frontend varsayılan olarak API'yi `http://localhost:5000/api` üzerinden çağırır. Gerekirse
> `frontend/.env` içinde `VITE_API_URL` ile değiştirilebilir.

---

## ▶️ Çalıştırma

İki ayrı terminalde:

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

Tarayıcıda **http://localhost:5173** adresini açın.

---

## 🔑 Sunum İçin Test Hesapları

`npm run seed` sonrası kullanılabilir hesaplar:

| Rol | E-posta | Şifre |
|-----|---------|-------|
| 🛡️ Admin | `admin@medirandevu.local` | `admin123` |
| 👤 Hasta | `hasta1@medirandevu.local` | `hasta123` |
| 👤 Hasta | `hasta2@medirandevu.local` | `hasta123` |
| 👨‍⚕️ Doktor | `ahmet.yilmaz@medirandevu.local` | `doktor123` |
| 👨‍⚕️ Doktor | `elif.demir@medirandevu.local` | `doktor123` |
| 👨‍⚕️ Doktor | *(diğer 8 doktor — `ad.soyad@medirandevu.local`)* | `doktor123` |

> **hasta1** hesabının hazır randevuları vardır: **geçmiş** (Değerlendir butonu), **gelecek**
> (İptal Et butonu) ve bir **iptal** kaydı — tüm akışları tek hesapta görebilirsiniz.

---

## 🔌 API Uçları

Taban yol: `/api` · Yanıt formatı: `{ success, message?, data }` (hata: `{ success, message }`)

| Metot | Uç | Açıklama | Erişim |
|-------|-----|----------|--------|
| POST | `/auth/register` | Kayıt (rol: HASTA) | Açık |
| POST | `/auth/login` | Giriş (JWT) | Açık |
| GET | `/departments` | Bölümler | Açık |
| POST | `/departments` | Bölüm oluştur | ADMIN |
| GET | `/doctors?departmentId=` | Doktorlar | Açık |
| POST | `/doctors` | Doktor oluştur | ADMIN |
| GET | `/appointments/available?doctorId=&date=` | Boş slotlar | Bearer |
| POST | `/appointments` | Randevu oluştur | HASTA |
| DELETE | `/appointments/:id` | Randevu iptal | Sahibi / ADMIN |
| GET | `/appointments/me` | Kendi randevularım | HASTA |
| GET | `/appointments/doctor` | Doktor ajandası | DOKTOR |
| POST | `/reviews` | Değerlendirme bırak | HASTA |

---

## 📐 İş Kuralları

- Randevular **30 dakikalık** slotlar halindedir: `09:00, 09:30, … 16:30` (mesai 09:00–17:00).
- Bir hasta **aynı gün** için yalnızca **bir aktif** randevu alabilir.
- Bir doktor aynı gün ve saat diliminde yalnızca **bir** hastaya randevu verir.
- **Geçmiş** tarih/saate randevu alınamaz.
- İptal edilen randevu silinmez (durum `IPTAL`), slotu anında boşa çıkar.
- Değerlendirme yalnızca **geçmiş** ve **iptal edilmemiş** kendi randevusu için, randevu başına **bir kez** yapılabilir.

---

<div align="center">

**MediRandevu** · Spec-Driven Development ile geliştirilmiştir 🩺

</div>
