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
- [ ] T010 [P] ~~Kimlik doğrulama yardımcılarını oluştur: `backend/src/utils/auth.js`~~ — ⚠️ SAPMA: bcryptjs/jwt mantığı `authController.js` ve `authMiddleware.js` içine gömüldü (ayrı util yazılmadı). İşlevsel olarak tam; DRY iyileştirmesi opsiyonel.
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

- [ ] T040 [US2] Randevu servisine ekle: `frontend/src/services/appointmentService.js` — `getMine`, `cancel`
- [ ] T041 [US2] Randevularım sayfasını oluştur: `frontend/src/pages/Randevularim.jsx` (aktif randevuları listele, iptal butonu) — T040'a bağlı

**Checkpoint**: US1 ve US2 bağımsız olarak çalışıyor. FAZ 2 bitti.

---

## FAZ 3 — DOKTOR PANELİ, TEST VE CİLA (Gün 11–15)

## Phase 11: User Story 3 (Frontend) — Gün 11 (Doktor Ajandası)

**Goal (US3)**: Doktorun kendi randevularını liste/ajanda olarak görmesi.

**Independent Test**: Doktor rolüyle giriş → yalnızca kendi randevuları tarih+saate sıralı listelenir.

- [ ] T042 [US3] Randevu servisine ekle: `frontend/src/services/appointmentService.js` — `getDoctorAgenda`
- [ ] T043 [US3] Doktor ajanda sayfasını oluştur: `frontend/src/pages/DoktorAjanda.jsx` (kendi randevuları, tarih+saate sıralı) — T042'ye bağlı

**Checkpoint**: Üç kullanıcı hikâyesi de bağımsız olarak çalışıyor.

---

## Phase 12: Polish — Gün 12 (Form Validasyonları & Toast Bildirimleri)

**Purpose**: Tüm hikâyeleri etkileyen kesişen iyileştirmeler.

- [ ] T044 [P] Toast/bildirim bileşenini (veya sağlayıcısını) oluştur: `frontend/src/components/Toast.jsx`
- [ ] T045 İstemci tarafı form validasyonlarını ekle: `frontend/src/pages/Login.jsx`, `frontend/src/pages/Register.jsx`, `frontend/src/pages/RandevuAl.jsx` (zorunlu alan, email formatı, tarih/slot seçimi)
- [ ] T046 Başarı/hata toast bildirimlerini sayfalara bağla (API `{ "error": ... }` cevaplarını göster): tüm hasta/doktor sayfaları

**Checkpoint**: Formlar doğrulanıyor, kullanıcı geri bildirimleri toast ile gösteriliyor.

---

## Phase 13: Polish — Gün 13 (Güvenlik — Protected Routes)

- [ ] T047 ProtectedRoute bileşenini oluştur: `frontend/src/router/ProtectedRoute.jsx` (token yoksa Login'e yönlendir; opsiyonel rol kontrolü — doktor sayfası DOKTOR'a)
- [ ] T048 Korumalı sayfaları sarmala: `frontend/src/router/index.jsx` — Home, RandevuAl, Randevularim, DoktorAjanda için ProtectedRoute uygula

**Checkpoint**: Yetkisiz erişim engelleniyor (SC-006).

---

## Phase 14: Polish — Gün 14 (Prisma Seed — Sahte Veri)

- [ ] T049 Prisma seed script'ini yaz: `backend/prisma/seed.js` (5 bölüm, 10 doktor + ilgili DOKTOR User'ları, örnek randevular) ve `backend/package.json`'a `prisma.seed` / `npm run seed` ekle
- [ ] T050 Seed'i çalıştır ve veriyi doğrula: `npm run seed` (backend) → 5 bölüm, 10 doktor, örnek randevular oluştu

**Checkpoint**: Sunum için gerçekçi veri hazır.

---

## Phase 15: Polish — Gün 15 (Kod Temizliği & Dokümantasyon)

- [ ] T051 [P] `README.md` yaz (repo kökü): kurulum, ortam değişkenleri, backend/frontend çalıştırma, API uçları özeti (contracts/api.md'ye referans)
- [ ] T052 Kod temizliği: kullanılmayan kodu kaldır, hata cevaplarını tutarlı hale getir, modüler yapıyı doğrula (backend routes/controllers/middlewares/models/utils; frontend pages/components/services/store)
- [ ] T053 Tam uçtan uca doğrulama: quickstart.md tüm senaryoları (1–6 + UI akışı) çalıştır ve geç

**Checkpoint**: Proje teslime hazır. FAZ 3 bitti.

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
