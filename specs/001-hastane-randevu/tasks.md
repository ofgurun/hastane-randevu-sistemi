---

description: "Task list for Hastane Randevu Sistemi (MVP) implementation"
---

# Tasks: Hastane Randevu Sistemi (MVP)

**Input**: Design documents from `/specs/001-hastane-randevu/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Otomatik test paketi MVP kapsamı dışıdır (bkz. plan.md Complexity Tracking). Doğrulama,
quickstart.md senaryoları ve manuel HTTP testleriyle yapılır. Bu nedenle ayrı test görevleri
üretilmemiştir.

**Organization**: Görevler, kullanıcının 15 günlük planına (Adım Adım İlerle — Constitution İlke IV)
sadık kalınarak gün-gün fazlara bölünmüştür; her görev izlenebilirlik için ilgili kullanıcı
hikâyesiyle ([US1]/[US2]/[US3]) etiketlenmiştir.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Paralel çalıştırılabilir (farklı dosyalar, bağımlılık yok)
- **[Story]**: Görevin hizmet ettiği kullanıcı hikâyesi (US1/US2/US3); Setup ve cila görevlerinde etiket yoktur
- Her görevde kesin dosya yolu belirtilmiştir

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/` (bkz. plan.md Project Structure)

## User Story ↔ Faz Eşlemesi

- **US1 (P1) — Hasta randevu alma**: Gün 3, 4, 5(oluşturma) backend + Gün 6, 7, 8, 9 frontend
- **US2 (P2) — Randevularım & iptal**: Gün 5(iptal, /me) backend + Gün 10 frontend
- **US3 (P3) — Doktor ajandası**: Gün 5(/doctor) backend + Gün 11 frontend

## Kapsam Güncellemesi (Yönetici Talepleri — 2026-07-13)

Proje sahibi tarafından onaylanan, önceden "Kapsam Dışı" olan yeni gereksinimler eklendi:

- **Admin CRUD**: `POST /api/departments` ve `POST /api/doctors` uçları `authorize("ADMIN")` ile korunuyor. ✅ (Gün 3)
- **Hizmet Değerlendirmesi**: `Review` modeli şemaya eklendi ve migrate edildi. ✅ (Gün 2 DB). API uçları ileride tanımlanacak.
- **E-posta Bildirimleri**: `nodemailer` bağımlılığı kuruldu; e-posta gönderim mantığı **Gün 5**'te eklenecek. ⏳
- **Yanıt Standardizasyonu**: Tüm uçlar `{ success, message, data }` / hata `{ success, message }` döndürüyor + merkezi `errorHandler`. ✅
- ⚠️ **Spec senkronu bekliyor**: `spec.md` "Kapsam Dışı" bölümü ve `contracts/api.md` bu yeni kapsama göre güncellenmeli (öneri).

---

## FAZ 1 — BACKEND VE API GELİŞTİRME (Gün 1–5)

## Phase 1: Setup — Gün 1 (Proje İskeleti & Veri Modeli)

**Purpose**: Monorepo yapısı, Express + Prisma kurulumu, DB bağlantısı ve modellerin migrate edilmesi.

- [X] T001 Monorepo kök yapısını oluştur: `backend/` ve `frontend/` klasörleri (repo kökünde)
- [X] T002 Backend Node projesini başlat ve bağımlılıkları kur: `backend/package.json` (express, @prisma/client, prisma, jsonwebtoken, bcryptjs, cors, dotenv; dev: nodemon) — `npm install` çalıştı (package-lock.json + node_modules)
- [X] T003 [P] Ortam ve git dosyalarını oluştur: `backend/.env.example` (DATABASE_URL, JWT_SECRET, PORT) ve `backend/.gitignore` (node_modules, .env) — ayrıca gerçek `backend/.env` (gitignore'lı, Supabase URL'leri + üretilmiş JWT_SECRET; parola placeholder)
- [X] T004 Prisma'yı başlat ve datasource/generator'ı ayarla: `backend/prisma/schema.prisma` (provider: postgresql, url: env(DATABASE_URL), directUrl: env(DIRECT_URL))
- [X] T005 Prisma modellerini ve enum'ları tanımla: `backend/prisma/schema.prisma` — `Role`(HASTA|DOKTOR|ADMIN), `AppointmentStatus`(AKTIF|IPTAL), `User`, `Department`, `Doctor`, `Appointment` (data-model.md'ye göre alanlar ve ilişkiler; `@@unique([doctorId, date, timeSlot])`)
- [X] T006 İlk migration'ı çalıştır: `npx prisma migrate dev --name init` (backend kökünde) ve veritabanı bağlantısını doğrula — migration `20260713110436_init` uygulandı, Supabase bağlantısı GET uçlarıyla doğrulandı
- [X] T007 Prisma client singleton'ını oluştur: `backend/src/models/prismaClient.js`
- [X] T008 Express uygulama girişini oluştur: `backend/src/index.js` (cors, express.json, `/api` taban router'ı + `/api/health`, PORT'ta dinleme)

**Checkpoint**: Sunucu ayağa kalkıyor, veritabanı bağlı ve modeller migrate edilmiş.

---

## Phase 2: Foundational — Gün 2 (Auth & Middleware — Bloklayıcı)

**Purpose**: Tüm korumalı uçların dayandığı kimlik doğrulama ve merkezi hata yönetimi altyapısı.

**⚠️ CRITICAL**: Bu faz tamamlanmadan hiçbir kullanıcı hikâyesi uçları çalıştırılamaz.

- [X] T009 [P] Merkezi hata yönetimi middleware'ini oluştur: `backend/src/middlewares/errorHandler.js` — `notFound` (JSON 404) + `errorHandler` (yakalanmamış hatalar), format `{ success, message }`, ham detay sızdırmaz; `index.js`'e en sona bağlandı (Constitution İlke III)
- [X] T010 [P] Kimlik doğrulama yardımcıları: bcryptjs hash/compare + jwt sign/verify — bilinçli karar gereği ayrı `utils/auth.js` yerine `authController.js` ve `authMiddleware.js` içinde inline uygulandı (Gün 12 onayı). İşlevsel gereksinim tam karşılandı.
- [X] T011 JWT auth middleware'ini oluştur: `backend/src/middlewares/authMiddleware.js` — `authenticate` (Bearer doğrula, `req.user` doldur) + `authorize(...roles)` (rol tabanlı 403)
- [X] T012 Auth controller'ını yaz: `backend/src/controllers/authController.js` — `register` (rol istemciden ALINMAZ, her zaman HASTA — güvenlik), `login` (JWT üret); standart `{ success, message, data:{ user, token } }`, try-catch
- [X] T013 Auth route'larını oluştur ve bağla: `backend/src/routes/authRoutes.js` (POST `/api/auth/register`, `/login`) ve `index.js` mount

**Checkpoint**: Kayıt/giriş çalışıyor, JWT üretiliyor, korumalı uçlar için middleware hazır.

---

## Phase 3: User Story 1 (Backend) — Gün 3 (Bölüm & Doktor API)

**Goal (US1)**: Hastanın bölümleri ve doktorları görüntüleyebilmesi.

**Independent Test**: `GET /api/departments` 5 bölüm; `GET /api/doctors?departmentId=<id>` yalnızca o bölümün doktorlarını döner.

- [X] T014 [P] [US1] Bölüm controller'ını yaz: `backend/src/controllers/departmentController.js` — `getAllDepartments` + `createDepartment` (ADMIN, yönetici talebi), try-catch
- [X] T015 [P] [US1] Doktor controller'ını yaz: `backend/src/controllers/doctorController.js` — `getAllDoctors` (opsiyonel `departmentId` filtresi, user+department include) + `createDoctor` (ADMIN), try-catch
- [X] T016 [US1] Bölüm route'unu oluştur ve bağla: `backend/src/routes/departmentRoutes.js` (GET açık, POST `authenticate+authorize("ADMIN")`) + `index.js` mount
- [X] T017 [US1] Doktor route'unu oluştur ve bağla: `backend/src/routes/doctorRoutes.js` (GET açık, POST `authenticate+authorize("ADMIN")`) + `index.js` mount

**Checkpoint**: Bölüm ve doktor listeleme uçları çalışıyor; POST'lar ADMIN korumalı (yönetici talebi).

---

## Phase 4: User Story 1 (Backend) — Gün 4 (Randevu Motoru — Boş Slotlar)

**Goal (US1)**: Bir doktor ve tarih için boş 30 dk slotların hesaplanıp listelenmesi.

**Independent Test**: `GET /api/appointments/available?doctorId=<id>&date=<gelecek>` dolu olmayan slotları döner; bugün için geçmiş slotlar hariç.

- [X] T018 [P] [US1] Slot yardımcılarını yaz: `backend/src/utils/slots.js` — `generateSlots()` (09:00–16:30, 30 dk = 16 slot), `slotToMinutes()` (test edildi)
- [X] T019 [US1] Appointment controller'ına boş slot fonksiyonunu ekle: `backend/src/controllers/appointmentController.js` — `getAvailableSlots` (tüm slotlar − doctor+date **AKTIF** randevular; bugünse geçmiş slotlar çıkarılır; doktor 404 kontrolü; try-catch)
- [X] T020 [US1] Appointment route dosyasını oluştur ve GET `/api/appointments/available` ucunu (`authenticate`) ekle + `index.js` mount: `backend/src/routes/appointmentRoutes.js`

**Checkpoint**: Boş slot hesabı doğru çalışıyor (AKTIF dolu ve geçmiş slotlar hariç, IPTAL boşa çıkar). ✅ 15/15 entegrasyon testi geçti.

---

## Phase 5: User Stories 1/2/3 (Backend) — Gün 5 (Randevu Oluşturma/İptal/Listeleme)

**Goal**: Randevu oluşturma (US1), iptal + kendi randevuları (US2), doktor ajandası (US3) uçları ve iş kuralı kontrolleri.

**Independent Test**: quickstart.md Senaryo 4–6 (çakışma 409, geçmiş 400, iptal→slot boşa çıkar, yalnızca kendi verisi).

- [X] T021 [US1] Randevu oluşturma: `backend/src/controllers/appointmentController.js` — `createAppointment` (POST): slot geçerliliği, geçmiş tarih/saat reddi (FR-014), doktor slot çakışması (FR-013), hastanın aynı gün AKTIF randevusu (FR-012) → 409; başarı 201 AKTIF + onay e-postası; try-catch
- [X] T022 [US2] Randevu iptal: `appointmentController.js` — `cancelAppointment` (DELETE `:id`): sahibi hasta **veya ADMIN** (FR-015, aksi→403), zaten IPTAL→400, status→IPTAL + iptal e-postası; try-catch
- [X] T023 [US2] `getMyAppointments` (GET `/me`): yalnızca giriş yapan hastanın AKTIF randevuları, doctor+department include, tarih+saate sıralı; try-catch
- [X] T024 [US3] `getDoctorAgenda` (GET `/doctor`): yalnızca giriş yapan doktorun AKTIF randevuları (userId→doctor), patient include, sıralı, rol DOKTOR değilse 403; try-catch
- [X] T025 [US1] appointment route'ları: `backend/src/routes/appointmentRoutes.js` — GET `/available`, GET `/me`, GET `/doctor`, POST `/`, DELETE `/:id` (hepsi authenticate)
- [X] T026 [US1] Randevu + review + e-posta + /me + /doctor uçları doğrulandı: **24/24 + 8/8 entegrasyon testi** geçti; Ethereal ile 4 e-posta önizlemesi üretildi.
- [X] T5-E [US1] E-posta altyapısı: `backend/src/utils/email.js` (nodemailer, Ethereal SMTP) — `sendAppointmentConfirmation`, `sendAppointmentCancellation`; oluştur/iptal'de best-effort çağrılıyor. (yönetici talebi)
- [X] T5-R Değerlendirme ucu: `backend/src/controllers/reviewController.js` + `routes/reviewRoutes.js` — POST `/api/reviews` (geçmiş+AKTIF+sahiplik+1-5+tek/randevu). (yönetici talebi)

**Checkpoint**: ✅ **FAZ 1 (Backend) TAMAMLANDI** — tüm randevu/review/e-posta/me/doctor uçları çalışıyor ve test edildi (toplam 32 entegrasyon testi yeşil).

---

## FAZ 2 — FRONTEND VE UI GELİŞTİRME (Gün 6–10)

## Phase 6: User Story 1 (Frontend) — Gün 6 (Vite Projesi, Router, **Tailwind CSS**, Login/Register)

**Goal (US1)**: React/Vite iskeleti, yönlendirme, UI kütüphanesi ve giriş/kayıt sayfa tasarımları.
**Not (Gün 6):** UI kütüphanesi **MUI → Tailwind CSS** olarak değiştirildi (proje sahibi kararı). Gün 6 yalnızca UI; API/Zustand Gün 7'de.

- [X] T027 Frontend Vite React projesini başlat ve bağımlılıkları kur: `frontend/` (react, react-dom, react-router-dom, **tailwindcss@3 + postcss + autoprefixer**, axios, lucide-react). tailwind.config.js + index.css yapılandırıldı.
- [X] T028 [P] Uygulama girişini ve router'ı kur: `frontend/src/main.jsx` (mevcut), `frontend/src/App.jsx` (BrowserRouter + Routes; `/login`, `/register`, `/` ve `*` → /login yönlendirme)
- [X] T029 [P] [US1] Giriş sayfasını tasarla: `frontend/src/pages/Login.jsx` (Tailwind, email + şifre; paylaşılan `AuthLayout` + `TextField` bileşenleri, hastane mavi/lacivert teması)
- [X] T030 [P] [US1] Kayıt sayfasını tasarla: `frontend/src/pages/Register.jsx` (Tailwind, ad + email + şifre)

**Checkpoint**: ✅ Frontend derleniyor (vite build) ve dev sunucusu HTTP 200 veriyor; Login/Register sayfaları hazır (UI-only). Klasörler `components/`, `pages/`, `services/`, `store/` oluşturuldu.

---

## Phase 7: User Story 1 (Frontend) — Gün 7 (Zustand Auth + Axios Interceptor)

**Goal (US1)**: Auth durum yönetimi, JWT'nin localStorage'a yazılması ve Axios interceptor.

- [X] T031 [US1] Zustand auth store'unu oluştur: `frontend/src/store/authStore.js` (user, token, isAuthenticated, isLoading, error; **persist** middleware; async login/register/logout + clearError)
- [X] T032 [US1] Axios instance + request interceptor: `frontend/src/services/api.js` (baseURL `http://localhost:5000/api`, `Authorization: Bearer <token>` başlığını localStorage'dan ekler)
- [X] T033 [US1] Login/Register sayfalarını store'a bağla: `onSubmit` → login/register; loading'de buton disable + "…yapılıyor"; hata kırmızı metin; başarıda `useNavigate("/")`. (Ayrı authService yerine çağrılar doğrudan store'da — modüler ve yeterli.)
- [X] T033a Geçici korumalı `/` (App.jsx `TempHome`): giriş akışını test etmek için oturum doğrulama + çıkış (Gün 8'de gerçek Ana Sayfa ile değişecek; liste İÇERMEZ).

**Checkpoint**: ✅ Giriş/kayıt çalışıyor — token localStorage'a yazılıyor, interceptor isteklere ekliyor, hata gösteriliyor. Sözleşme testi **7/7** geçti; frontend derleniyor.

---

## Phase 8: User Story 1 (Frontend) — Gün 8 (Hasta Ana Sayfası — Bölüm/Doktor Listesi)

**Goal (US1)**: Bölümlerin ve doktorların listelenmesi.

- [X] T034 [P] [US1] Bölüm ve doktor servislerini yaz: `frontend/src/services/departmentService.js` (`getDepartments`), `frontend/src/services/doctorService.js` (`getDoctorsByDepartment`) — api.js kullanır
- [X] T035 [US1] Ana sayfayı oluştur: `frontend/src/pages/Home.jsx` — üst bar (Logo + kullanıcı + çıkış), bölüm grid'i (`components/DepartmentCard.jsx`, lucide ikonları, loading/error/empty durumları), bölüme tıklayınca doktorları modalda gösterir (`components/DoctorModal.jsx`, user.name + title, **pasif "Randevu Al"** butonu — Gün 9)
- [X] T035a `TempHome` kaldırıldı; `App.jsx` `/` rotası gerçek `Home` sayfasına bağlandı (oturum kontrolü Home içinde).

**Checkpoint**: ✅ Hasta bölümleri grid'de görüyor, bölüme tıklayınca o bölümün doktorlarını (ad + unvan) modalda görüyor. Servis sözleşme testi **6/6** geçti; frontend derleniyor. (Randevu alma + takvim Gün 9'a bırakıldı.)

---

## Phase 9: User Story 1 (Frontend) — Gün 9 (Randevu Alma Ekranı)

**Goal (US1)**: Tarih seçici + boş slot listesi + randevu oluşturma. Bu, US1'in uçtan uca tamamlanmasıdır (MVP).

- [X] T036 [P] [US1] Randevu servisini yaz: `frontend/src/services/appointmentService.js` — `getAvailableSlots(doctorId, date)`, `createAppointment(doctorId, date, timeSlot)`
- [X] T037 [US1] Tarih seçici: `BookingModal.jsx` içinde `<input type="date" min={today}>` (geçmiş tarih engellenir) — ayrı DateSelector yerine modal içine gömüldü
- [X] T038 [US1] Slot listesi: `BookingModal.jsx` içinde tıklanabilir slot grid'i (loading/empty/hata durumları) — ayrı SlotList yerine modal içine gömüldü
- [X] T039 [US1] Randevu alma akışı: `components/BookingModal.jsx` — DoctorModal'daki "Randevu Al" aktif → doktor için tarih seç → boş slotlar grid'de → slota tıkla → `createAppointment` → yeşil başarı mesajı; `Home.jsx` bağlandı. (Ayrı RandevuAl sayfası yerine modal akışı — kullanıcı tercihi.)
- [X] T039a Demo veri: 2 bölüm (Kardiyoloji, Göz Hastalıkları) + 4 doktor eklendi (geçici script, arayüz testi için DB'de kalıcı).

**Checkpoint 🎯 MVP**: ✅ Hasta kayıt/giriş → bölüm/doktor → tarih/slot → randevu alma akışını uçtan uca tamamlayabiliyor. Akış testi **5/5** geçti (slot çek, randevu oluştur, slot düşer, aynı gün 2. randevu 409). US1 uçtan uca TAMAM.

---

## Phase 10: User Story 2 (Frontend) — Gün 10 (Randevularım & İptal)

**Goal (US2)**: Hastanın aktif randevularını görüp iptal edebilmesi.

**Independent Test**: "Randevularım" ekranı yalnızca kendi aktif randevularını gösterir; iptal sonrası slot yeniden boşa çıkar.

- [X] T040 [US2] Randevu servisine ekle: `frontend/src/services/appointmentService.js` — `getMyAppointments()` (GET /me), `cancelAppointment(id)` (DELETE /:id)
- [X] T041 [US2] Randevularım sayfasını oluştur: `frontend/src/pages/Appointments.jsx` — kart listesi (Bölüm, Doktor, Tarih, Saat, Durum rozeti AKTİF/İPTAL); loading + "Henüz randevunuz yok" empty state; AKTİF olanlarda kırmızı "İptal Et" → cancel → yeşil başarı + durum state'te IPTAL'e döner
- [X] T042 [US2] Routing + navigasyon: `App.jsx`'e `/appointments` rotası; paylaşılan `components/Navbar.jsx` (Ana Sayfa ↔ Randevularım linkleri + çıkış), `Home.jsx` ve `Appointments.jsx`'te kullanılıyor

**Checkpoint**: ✅ **FAZ 2 (Frontend) TAMAMLANDI** — US1 (randevu alma) ve US2 (randevularım/iptal) uçtan uca çalışıyor. Randevularım/iptal testi **6/6** geçti. Not: `/me` yalnızca AKTİF döndürür (FR-017); iptal edilen randevu, oturum içinde IPTAL rozetiyle görünür, sayfa yenilenince (AKTİF-only) listeden düşer.

---

## FAZ 3 — DOKTOR PANELİ, TEST VE CİLA (Gün 11–15)

## Phase 11: User Story 3 (Frontend) — Gün 11 (Doktor Ajandası)

**Goal (US3)**: Doktorun kendi randevularını liste/ajanda olarak görmesi.

**Independent Test**: Doktor rolüyle giriş → yalnızca kendi randevuları tarih+saate sıralı listelenir.

- [X] T043 [US2] Backend `/me` güncellemesi: `getMyAppointments` artık AKTİF + IPTAL döndürür, tarihe göre yeniden eskiye sıralı (FR-017 + contracts/api.md güncellendi). Randevularım sayfası artık iptal geçmişini de gösterir.
- [X] T044 [US3] Randevu servisine ekle: `frontend/src/services/appointmentService.js` — `getDoctorAppointments()` (GET /appointments/doctor)
- [X] T045 [US3] Doktor ajanda sayfasını oluştur: `frontend/src/pages/DoctorDashboard.jsx` — read-only ajanda (Tarih, Saat, Hasta Adı, Durum), loading + "Henüz randevunuz yok" empty state
- [X] T046 [US3] Rol bazlı yönlendirme: `Login.jsx` giriş sonrası DOKTOR→`/doctor-dashboard`, HASTA→`/`; `App.jsx`'e `/doctor-dashboard` rotası (DoctorDashboard içinde DOKTOR rol kontrolü); `Navbar.jsx` doktorda yalnızca "Ajandam" + "Çıkış" gösterir

**Checkpoint**: ✅ Üç kullanıcı hikâyesi de çalışıyor. Doktor giriş → ajanda; hasta geçmiş (iptal) randevularını görüyor. Gün 11 testi **5/5** geçti.

---

## Phase 12: Polish — Gün 12 (Form Validasyonları & Toast Bildirimleri)

**Purpose**: Tüm hikâyeleri etkileyen kesişen iyileştirmeler.

- [X] T047 Toast altyapısı: `react-hot-toast` kuruldu, `App.jsx`'e `<Toaster position="top-right" />` eklendi.
- [X] T048 İstemci tarafı form validasyonları: `Login.jsx` (email formatı, şifre ≥6) ve `Register.jsx` (ad dolu + email + şifre ≥6) — istek gitmeden `toast.error` ile uyarı, form gönderilmez.
- [X] T049 Toast entegrasyonu + statik mesaj temizliği: Login/Register/Appointments(iptal)/BookingModal(randevu) ve ayrıca Home/DoctorModal/DoctorDashboard'daki satır-içi yeşil/kırmızı mesajlar kaldırıldı; `toast.success`/`toast.error` (hata mesajı `error.response.data.message`'dan) kullanılıyor. Yükleme hataları nötr metin + toast.
- [X] T050 Backend: `GET /appointments/doctor` artık AKTİF + IPTAL döndürüyor; doktor ajandasında iptaller soluk (pasif) İPTAL rozetiyle görünüyor.

**Checkpoint**: ✅ Formlar doğrulanıyor, tüm geri bildirimler toast ile. Gün 12 backend testi **2/2** geçti; frontend derleniyor.

---

## Phase 13: Polish — Gün 13 (Güvenlik — Protected Routes)

- [X] T051 ProtectedRoute bileşeni: `frontend/src/components/ProtectedRoute.jsx` (giriş yoksa /login; `allowedRoles` ile rol kontrolü → yanlış rolde kendi ana sayfasına) + `GuestRoute.jsx` (girişliyse login/register'ı engelle, rolüne göre yönlendir)
- [X] T052 App.jsx rotalarını sarmala: `/` (girişli), `/appointments` (HASTA), `/doctor-dashboard` (DOKTOR), `/login` + `/register` (GuestRoute). Sayfalardaki tekrarlı satır-içi guard'lar kaldırıldı (merkezileştirildi).
- [X] T053 Değerlendirme (Review) sistemi: `services/reviewService.js` (`createReview`), `components/ReviewModal.jsx` (1-5 yıldız + yorum), `Appointments.jsx` — geçmiş+AKTİF randevuda "İptal Et" yerine "Değerlendir"; başarıda toast + "Değerlendirildi" pasif rozet (409'da da gizlenir)

**Checkpoint**: ✅ Yetkisiz erişim merkezi olarak engelleniyor (SC-006). Değerlendirme arayüzü bağlandı. Gün 13 testi **3/3** geçti; frontend derleniyor.

---

## Phase 14: Polish — Gün 14 (Prisma Seed — Sahte Veri)

- [X] T054 Prisma seed script'ini yaz: `backend/prisma/seed.js` — önce temizlik (Review→Appointment→Doctor→Department→User), 5 bölüm, 10 doktor (bcrypt, şifre `doktor123`), 2 hasta (`hasta123`), geçmiş (değerlendirilebilir) + gelecek AKTİF + örnek iptal randevular. `package.json` `prisma.seed` / `npm run seed` mevcut (Gün 1).
- [X] T055 Seed'i çalıştır ve doğrula: `npm run seed` → 5 bölüm, 10 doktor, 2 hasta, 9 randevu. Gerçek login ile doğrulama **8/8** geçti (hasta1: 2 geçmiş-AKTİF, 2 gelecek, 1 iptal; doktor ajandası dolu).

**Checkpoint**: ✅ Veritabanı sunum için tutarlı demo veriyle dolu. Örnek giriş: `hasta1@medirandevu.local`/`hasta123`, `ahmet.yilmaz@medirandevu.local`/`doktor123`.

**Checkpoint**: Sunum için gerçekçi veri hazır.

---

## Phase 15: Polish — Gün 15 (Kod Temizliği & Dokümantasyon)

- [X] T056 [P] `README.md` yazıldı (repo kökü): amaç/özet, teknoloji tablosu, proje yapısı, kurulum (npm install + .env + migrate + seed), çalıştırma, **test hesapları tablosu**, API uçları, iş kuralları.
- [X] T057 Kod temizliği: frontend `oxlint` **temiz** (kullanılmayan import/değişken yok); unutulmuş `console.log` yok (backend'dekiler kasıtlı: seed özeti, sunucu logu, e-posta önizleme); yanlışlıkla kökte oluşmuş `package.json`/`package-lock.json`/`node_modules` kaldırıldı; kök `.gitignore` eklendi.
- [X] T058 Tam uçtan uca doğrulama: 15 gün boyunca her faz entegrasyon testleriyle doğrulandı (backend akış testleri + servis sözleşme testleri + seed doğrulaması, hepsi yeşil). Frontend her gün `vite build` ile derlendi.

**Checkpoint**: ✅ **FAZ 3 TAMAMLANDI — Proje teslime/sunuma hazır.** 🎉

---

## FAZ 4 — ADMIN PANELİ & HATIRLATMA (proje gereksinimlerini tamamlama)

Proje gereksinimlerinde admin ekranı ve randevu öncesi hatırlatma e-postası vardı; 15 günlük
planda UI kapsam dışıydı. Adım adım ekleniyor.

## Phase 16: Admin Paneli — Adım 1 (Hesap + Giriş)

- [X] T059 ADMIN hesabı: `seed.js`'e `admin@medirandevu.local / admin123` (rol ADMIN) eklendi.
- [X] T060 Rol bazlı yönlendirme: `utils/roleRedirect.js` (`homePathForRole`: ADMIN→/admin, DOKTOR→/doctor-dashboard, HASTA→/); Login/GuestRoute/ProtectedRoute güncellendi.
- [X] T061 Admin rotası + iskelet: `App.jsx`'e `/admin` (ProtectedRoute allowedRoles={["ADMIN"]}); `pages/AdminDashboard.jsx` (giriş + yaklaşan özellikler iskeleti); `Navbar.jsx` ADMIN'e "Yönetim Paneli" gösterir.

**Checkpoint**: ✅ Admin giriş yapıp `/admin`'e ulaşıyor (giriş testi 3/3). Yönetim işlevleri sonraki adımlarda.

## Phase 17: Admin Paneli — Adım 2 (Bölüm Yönetimi)

- [X] T062 Servis: `departmentService.js`'e `createDepartment(data)` (POST /api/departments).
- [X] T063 UI: `components/DepartmentManagement.jsx` — bölüm ekleme formu (ad + açıklama) + mevcut bölümler tablosu; başarıda toast + liste anında güncellenir (refetch yok); aynı isim → 409 toast.error. `AdminDashboard.jsx`'e bağlandı.

**Checkpoint**: ✅ Admin bölüm ekleyip listeliyor (test 4/4: ekle 201, listede, aynı isim 409, hasta 403).

## Phase 18: Admin Paneli — Adım 3 (Doktor Yönetimi)

- [X] T064 Backend: `POST /api/doctors` yeniden yazıldı — body `{ name, email, password, title, departmentId }`; **Prisma `$transaction`** ile DOKTOR user (bcrypt hash) + Doctor profili atomik oluşturulur; 201; e-posta varsa 409; bölüm yoksa 404; şifre <6 → 400. `contracts/api.md` güncellendi.
- [X] T065 Servis: `doctorService.js`'e `getAllDoctors()` + `createDoctor(data)`.
- [X] T066 UI: `components/DoctorManagement.jsx` — sol form (Ad, E-posta, Şifre, Ünvan, Bölüm select) + sağ doktor tablosu (Ad, Ünvan, Bölüm, E-posta); başarıda toast + liste anında güncellenir; hata toast; `AdminDashboard.jsx`'e bağlandı.

**Checkpoint**: ✅ Admin doktor ekliyor; eklenen doktor giriş yapabiliyor (test 8/8, orphan user yok).

## Phase 19: Admin Paneli — Adım 4 (Hatırlatma E-postaları)

- [X] T067 Paket + şema: `node-cron` kuruldu; `Appointment`'a `reminderSent Boolean @default(false)` eklendi; migration `add_reminder_sent` uygulandı.
- [X] T068 Hatırlatma servisi: `email.js`'e `sendReminderEmail(...)`; `utils/cron.js` — `runReminders()` (AKTİF + reminderSent=false + zamanı <24s randevuları bulur, mail atar, reminderSent=true yapar) + `startReminderCron()` (node-cron, her dakika).
- [X] T069 Bağlama: `index.js` sunucu açılışında `startReminderCron()` çağırıyor.

**Checkpoint**: ✅ Hatırlatma testi **4/4** geçti — Ethereal'e gerçek mail düştü (önizleme URL'i), reminderSent işaretlendi, >24s randevu atlandı, mükerrer engellendi. Sunucu cron ile sorunsuz açılıyor.

**🎀 FAZ 4 TAMAMLANDI — tüm proje gereksinimleri (admin ekranı + hatırlatma) karşılandı.**

## Phase 20: Admin Paneli — Adım 5 (Takvim & Saat Yönetimi — TimeBlock)

- [X] T070 Şema: `TimeBlock` modeli (doctorId, date, timeSlot nullable — null=tüm gün kapalı); migration `add_time_blocks`; seed temizlik sırasına `timeBlock` eklendi.
- [X] T071 Backend: `scheduleController.js` + `adminRoutes.js` (`/api/admin`, ADMIN korumalı) — GET `doctors/:id/calendar?month=` (gün başına appointmentCount/bookedSlots/blockedSlots/dayClosed), POST `doctors/:id/blocks` (gün/saat **toggle**). `getAvailableSlots` blokları hariç tutuyor; `createAppointment` kapalı gün/saate 409 dönüyor.
- [X] T072 Frontend: `scheduleService.js`; `DoctorCalendarModal.jsx` — ay grid'i (sağ/sol ay gezinme), gün altı **doluluk renk barı** (yeşil %0-30 / turuncu %31-70 / kırmızı %71+ veya gün kapalı), güne tıklayınca detay: "Günü Komple Kapat/Aç" + 16 saat tek tek toggle (randevulu saatler mavi/kilitli); `DoctorManagement.jsx` tablosuna "Takvim/Saatler" butonu.

**Checkpoint**: ✅ Takvim/saat yönetimi testi **16/16** geçti (gün kapat→slot yok+409, aç→16 slot, saat kapat→liste/409, takvim doluluk yansıması, HASTA 403). **"Randevu alınacak saatleri açmak" gereksinimi de karşılandı — tüm proje gereksinimleri tamam.**

## Phase 21: Admin Paneli — Adım 6 (Yedek Doktor + İzne Ayır + Kaldır)

- [X] T073 Şema: `Doctor.backupDoctorId` (self-relation "DoctorBackup", nullable); migration `add_backup_doctor`; seed'e bölüm-içi karşılıklı yedek atamaları eklendi (mevcut DB'ye non-destructive script ile uygulandı).
- [X] T074 Backend: `POST /doctors` `backupDoctorId` kabul eder (aynı bölüm doğrulaması); `POST /api/admin/doctors/:id/leave` (günleri TimeBlock ile kapatır + AKTIF randevuları yedeğe aktarır, çakışan→IPTAL); `DELETE /api/admin/doctors/:id` (gelecek AKTIF'leri yedeğe aktarır, sonra review/appointment/block/doctor/user'ı transaction ile siler, backup referanslarını temizler). Yedeksiz+randevulu → 409.
- [X] T075 Servisler: `doctorService.js`'e `deleteDoctor(id)` + `setDoctorLeave(id, startDate, endDate)`.
- [X] T076 UI: doktor formuna "Yedek Doktor" select (bölüme göre filtreli); İşlemler sütunu genişletildi — `LeaveModal.jsx` (çift tarih seçici, bitiş<başlangıç engeli, "İzin bitiş tarihi işe dönüş tarihiyle aynıdır…" notu) + `DeleteDoctorModal.jsx` (ONAYLIYORUM yazma zorunluluğu → son uyarı → Evet, Sil / İptal); başarıda toast + liste anında güncellenir.

**Checkpoint**: ✅ Yedek/izin/silme testi **15/15** geçti (yedek bölüm doğrulaması 400, izin→günler kapalı+çakışan IPTAL, silme→randevu aktarımı+user silindi+login 401, yedeksiz 409, HASTA 403).

## Phase 22: Hasta UX — Takvimde Doluluk + Doktor Puanları

- [X] T077 Backend: `GET /api/doctors/:id/availability?month=YYYY-MM` (açık) — gün başına yalnızca sayısal özet `{ date, totalSlots, availableCount, dayClosed }` (dolu saat listesi sızdırılmaz; randevu ∪ kapalı saat birleşimi düşülür).
- [X] T078 Backend: `GET /api/doctors` (ve `?departmentId=` filtresi — bölüm doktorları da bu uçtan geliyor, ayrı `/departments/:id/doctors` ucu yok) yanıtına `Review` groupBy aggregate ile `averageRating` (1 ondalık, yoksa null) + `reviewCount` eklendi.
- [X] T079 Frontend: `doctorService.js`'e `getDoctorAvailability(doctorId, month)`; `BookingModal.jsx` yeniden yazıldı — date input yerine **ay grid'i takvim** (ay gezinme, geçmiş aya gidilemez), gün altı doluluk renk barı (yeşil ≤%30 / turuncu %31-70 / kırmızı %71+), **gün kapalı veya tamamen doluysa kırmızı + tıklanamaz**, geçmiş günler pasif; güne tıklayınca mevcut slot akışı; başlıkta doktorun ⭐ puanı.
- [X] T080 Frontend: `DoctorModal.jsx` doktor kartlarında ⭐ `averageRating / 5 · N Değerlendirme` (yorumsuz doktorda "Henüz değerlendirme yok"). Review akışı (geçmiş AKTIF randevuda Değerlendir → 1-5 yıldız + yorum, 409'da buton gizlenir) doğrulandı.

**Checkpoint**: ✅ Hasta UX testi **17/17** geçti (availability 400/404 doğrulamaları, boş gün 16/16, randevu+saat kapatma→14, gün kapatma→dayClosed+0, review 201/409/gelecek-400, aggregate 4.5/2 ve null/0). Frontend build temiz.

## Phase 23: Doktor Ajandası TAMAMLANDI Durumu + Admin Tablo Sayfalama

- [X] T081 Şema: `AppointmentStatus` enum'una `TAMAMLANDI` eklendi; migration `add_tamamlandi_status`.
- [X] T082 Backend: `PATCH /api/appointments/:id/complete` — yalnızca randevunun doktoru, AKTIF + saati başlamış randevu (gelecek→400, IPTAL→400, tekrar→400, başka doktor/HASTA→403). `cancelAppointment` TAMAMLANDI'yı iptal ettirmez (400); review TAMAMLANDI için açık kalır.
- [X] T083 Frontend `DoctorDashboard.jsx`: durum rozetleri — AKTİF (mavi), **TARİHİ GEÇTİ** (amber: AKTIF + başlangıç+2 saat geçmiş, işaretlenmemiş), TAMAMLANDI (yeşil), İPTAL (gri); başlamış AKTIF randevuda "Tamamlandı" butonu (anında state güncelleme + toast). Hasta `Appointments.jsx`: TAMAMLANDI rozeti, tamamlanan randevu değerlendirilebilir.
- [X] T084 Frontend `DoctorManagement.jsx`: Mevcut Doktorlar tablosuna **sayfalama** (sayfa başına 7; Önceki/Sonraki + "X–Y / N doktor"; silmede sayfa taşarsa otomatik geri çekilir). Ayrıca panel genişletildi (`max-w-7xl`, xl'de tablo 3/4 pay) — yatay kaydırma kalktı.

**Checkpoint**: ✅ Complete testi **10/10** geçti (403 yetki ×2, 400 kural ×3, 200 işaretleme, iptal engeli, TAMAMLANDI review 201, ajanda yansıması). Frontend build temiz.

## Phase 24: Doktor İşlem Menüsü + İzin Talebi Akışı

- [X] T085 Şema: `LeaveRequest` modeli (doctorId, startDate, endDate, status BEKLIYOR/ONAYLANDI/REDDEDILDI, decidedAt); migration `add_leave_requests`. `deleteDoctor` temizliğine leaveRequest eklendi.
- [X] T086 Backend: izin mantığı `utils/leave.js`'e çıkarıldı (`applyLeave` + `transferAppointments`) — admin "izne ayır" ve talep onayı aynı yardımcıyı kullanır. `cancelAppointment` yetkisi genişletildi: randevunun **doktoru** da iptal edebilir.
- [X] T087 Backend: `POST/GET /api/doctors/me/leave-requests` (DOKTOR; geçmiş tarih/366 gün/çakışan bekleyen talep doğrulamaları), `GET /api/admin/leave-requests` (bekleyenler önce, doktor+yedek bilgisiyle), `PATCH /api/admin/leave-requests/:id` (`approve`→izin uygulanır, yedeksiz+randevulu→409 ve talep BEKLIYOR kalır; `reject`).
- [X] T088 Frontend `DoctorDashboard.jsx`: "Tamamlandı" butonu yerine **"İşlem Yap"** dropdown — Tamamlandı (saati gelmemişse pasif) + Sil/İptal Et (iki adımlı "Emin misiniz?" onayı); başlıkta **"İzin Talep Et"** butonu → `LeaveRequestModal.jsx` (çift tarih seçici); "İzin Taleplerim" listesi (BEKLİYOR/ONAYLANDI/REDDEDİLDİ rozetleri).
- [X] T089 Frontend admin: `LeaveRequestManagement.jsx` — talepler listesi (doktor, bölüm, aralık, yedek doktor bilgisi), bekleyenlerde **Onayla/Reddet**; onayda kapatılan gün + aktarım istatistikli toast. `AdminDashboard.jsx`'e "İzin Talepleri" bölümü eklendi.

**Checkpoint**: ✅ İzin talebi testi **19/19** geçti (doktor iptali 200/403, talep doğrulamaları 400×2+403, 201+çakışma 409, admin liste+403, onay→ONAYLANDI+randevu yedeğe aktarım+gün kapalı, tekrar karar 400, yedeksiz onay 409→talep BEKLIYOR, red 200). Frontend build temiz.

## Phase 25: Frontend Redesign (Claude Design prototipi entegrasyonu)

- [X] T090 Tasarım sistemi: Plus Jakarta Sans + teal/stone paleti (`index.html`, `tailwind.config.js`, `index.css`); ortak yapı taşları `utils/ui.js` (formatlayıcılar, karo paleti, initials), `Modal.jsx` (animasyonlu kabuk), `StatusBadge.jsx` (tek renk semantiği); özel toast stili.
- [X] T091 Auth: `AuthLayout` split-screen (teal gradyan tanıtım paneli + Giriş/Kayıt segmenti); `Login`/`Register` yeni form dili.
- [X] T092 Hasta: `Home` üç görünümlü akış — hero + bölüm kartları (karo renkleri, doktor sayısı) → tam sayfa doktor listesi (⭐ yıldız dizisi) → `BookingView` (nokta göstergeli takvim + 16 slot ızgarası + **randevu onay modalı**, başarıda Randevularım'a yönlendirme). `Appointments`: tarih karolu kartlar + iptal onay modalı; `ReviewModal`: yıldız etiketleri (Kötü→Mükemmel).
- [X] T093 Doktor: ajanda kartları (saat | hasta | rozet | İşlem Yap menüsü), iptal onay modalı, İzin Taleplerim yan paneli, `LeaveRequestModal` yeni tasarım.
- [X] T094 Admin: **sekmeli panel** (Bölümler / Doktorlar / Takvim / İzin Talepleri + bekleyen rozeti) — veriler panelde tek seferde yüklenip sekmelere dağıtılır; doktor tablosu (Yedek sütunu + ikon aksiyonlar + 7'li sayfalama), Takvim sekmesi (`AdminCalendar` — doktor seçici, tablodan "Takvim" ile ön-seçim), `LeaveModal`/`DeleteDoctorModal` yeni tasarım. Eski `BookingModal/DoctorModal/DoctorCalendarModal/DepartmentCard/TextField/Logo` bileşenleri kaldırıldı.

**Checkpoint**: ✅ `npm run build` + `oxlint` temiz; tüm akışlar mevcut backend uçlarını değiştirmeden kullanıyor.

## Phase 26: Küçük İyileştirmeler

- [X] T095 Admin Takvim sekmesi: bugünden önceki günler pasif (tıklanamaz, soluk, doluluk barı gizli).
- [X] T096 İzin talebine **açıklama (reason)**: `LeaveRequest.reason` (migration `add_leave_request_reason`); create ucunda zorunlu + ≤500 karakter doğrulaması; doktor formunda textarea; açıklama hem doktorun "İzin Taleplerim" listesinde hem admin talep kartında görünür. Test **6/6** geçti (eksik/boş/501 karakter → 400, trim, iki listede de alan mevcut).
## Phase 27: Staj Geri Bildirimi — Profil, Şifre Sıfırlama, Bölüm Kartları

- [X] T099 **Hasta profil sayfası** (G1): `User`'a `phone/birthDate/gender/address` (migration `add_user_profile_fields`); `GET /auth/me`, `PATCH /auth/profile` (ad + kişisel bilgiler, birthDate yerel-gün formatlanır), `PATCH /auth/password` (mevcut şifre doğrulaması). Frontend: Navbar avatar → `/profil`; kişisel bilgi + şifre değiştirme kartları; store `updateUser`. Test **15/15**.
- [X] T100 **Şifremi unuttum** (G2): `PasswordResetToken` (tokenHash/expiresAt/usedAt, migration `add_password_reset_token`); `POST /auth/forgot-password` (generic yanıt = email enumeration önlemi, önceki token'ları geçersiz kılar), `POST /auth/reset-password` (tek kullanımlık, 1 saat). E-posta util'ine `sendPasswordReset` + Gmail (465/SSL) desteği; `FRONTEND_URL` env. Frontend: Login'de "Şifremi unuttum?" linki, ForgotPassword + ResetPassword sayfaları. Test **14/14**.
- [X] T101 **Bölüm kartları** (G3): `GET /departments/availability-summary` (bölüm başına 30 günlük boş slot sayısı + en yakın slot, tek sorgu setiyle in-memory hesap). Frontend: Home bölüm kartları gradyan + ikon (ada göre `deptVisual` eşlemesi: kalp/göz/kulak/diş/beyin… + yedek palet) + "Uygun randevu sayısı: N" + en yakın slot tarih rozeti / "bulunamadı" çanı. Test **7/7**.

**Checkpoint**: ✅ Üç görev de mevcut mimariyi bozmadan eklendi; toplam **36 backend testi** + build/lint temiz. Staj sorumlusunun üç isteği (profil güncelleme, şifremi unuttum, renkli/ikonlu bölüm kartları) karşılandı.

---

- [X] T098 Doktor paneli **Takviminiz**: `GET /api/doctors/me/availability?month=` (DOKTOR; availability hesabı `buildMonthAvailability` yardımcısına çıkarıldı) — ay görünümü yoğunluk barlı (sakin/orta/yoğun-kapalı; İPTAL hariç TAMAMLANDI dahil sayım ∪ kapalı slotlar), bugün vurgulu, güne tıklayınca sağ panelde o günün randevuları (saat + hasta + durum rozeti, İPTAL soluk); varsayılan seçim bugün. Test **6/6** geçti (400/401/403, randevulu gün 15, kapalı gün dayClosed+0, public uç regresyonsuz).
- [X] T097 İzin **çakışma korumaları**: yeni talep, BEKLIYOR **veya ONAYLANDI** taleple çakışıyorsa ya da aralıktaki tüm günler zaten kapalıysa (admin doğrudan izne ayırdıysa) 409; admin onayı da aynı iki korumayla 409 döner (talep BEKLIYOR kalır, red mümkün). Kısmi kapalı aralıkta talep serbest (kalan günler için). Test **11/11** geçti.

---

## Dependencies & Execution Order

### Phase (Gün) Bağımlılıkları

- **Setup (Gün 1)**: Bağımlılık yok — hemen başlar.
- **Foundational (Gün 2)**: Gün 1'e bağlı — TÜM kullanıcı hikâyesi uçlarını bloklar.
- **Backend hikâye fazları (Gün 3–5)**: Gün 2'ye bağlı; kendi aralarında sıralı (Gün 3 → 4 → 5).
- **Frontend (Gün 6–11)**: İlgili backend uçlarına bağlı; Gün 6 → 7 → 8 → 9 → 10 → 11 sırasıyla.
- **Cila (Gün 12–15)**: İlgili ekranların tamamlanmasına bağlı.

Constitution İlke IV (Adım Adım İlerle): Planlanan gün bitmeden bir sonrakine geçilmez; backend (Gün 1–5) frontend'den (Gün 6–10) önce tamamlanır.

### Kullanıcı Hikâyesi Bağımlılıkları

- **US1 (P1)**: Foundational sonrası başlar; diğer hikâyelere bağlı değil. MVP çekirdeği.
- **US2 (P2)**: Foundational + US1 randevu altyapısına dayanır (iptal edilecek randevu gerekir).
- **US3 (P3)**: Foundational sonrası bağımsız; randevu verisi seed/US1 ile beslenir.

### Bir Hikâye İçinde

- Utils/servis → controller/endpoint → route → UI sayfası sırası.
- Backend ucu, ilgili frontend ekranından önce.

## Parallel Opportunities

- Gün 1: T003 [P] diğer setup adımlarıyla paralel.
- Gün 2: T009 [P], T010 [P] paralel; T011/T012 T010'a bağlı.
- Gün 3: T014 [P], T015 [P] paralel (farklı controller dosyaları).
- Gün 4: T018 [P] bağımsız.
- Gün 6: T028/T029/T030 [P] paralel (farklı dosyalar).
- Gün 8: T034 [P] bağımsız.
- Gün 9: T036/T037/T038 [P] paralel (servis + iki bileşen).
- Gün 12: T044 [P] bağımsız.
- Gün 15: T051 [P] bağımsız.

### Parallel Example: Gün 3 (US1 Backend)

```bash
Task: "departmentController.js — getAll (backend/src/controllers/departmentController.js)"
Task: "doctorController.js — getAll + departmentId filtresi (backend/src/controllers/doctorController.js)"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Gün 1 Setup → Gün 2 Foundational (Auth) tamamla.
2. Gün 3–5(oluşturma) backend + Gün 6–9 frontend ile US1'i tamamla.
3. **DUR ve DOĞRULA**: quickstart Senaryo 1–4 ve UI randevu alma akışı.
4. Bu nokta gösterilebilir MVP'dir.

### Incremental Delivery

1. US1 (Gün 1–9) → MVP.
2. US2 (Gün 5 iptal/me + Gün 10) → randevu yönetimi.
3. US3 (Gün 5 /doctor + Gün 11) → doktor ajandası.
4. Cila (Gün 12–15) → validasyon, güvenlik, seed, dokümantasyon.

---

## Notes

- [P] = farklı dosyalar, bağımlılık yok.
- [Story] etiketi görevi ilgili kullanıcı hikâyesine izlenebilir kılar.
- Her API ucu try-catch + JSON hata cevabı içerir (Constitution İlke III).
- Modüler yapı korunur (Constitution İlke II).
- Plan dışı özellik eklenmez (Constitution İlke I — Sadece İsteneni Yap).
- Her checkpoint'te ilgili hikâye bağımsız doğrulanabilir.
