# Phase 1 Data Model: Hastane Randevu Sistemi (MVP)

Veri modeli Prisma şeması ile uygulanacaktır. Aşağıdaki dört varlık ve ilişkileri MVP kapsamını
tam olarak karşılar. Alan adları Prisma/JS geleneğine göre camelCase'dir.

## Enums

- **Role**: `HASTA` | `DOKTOR` | `ADMIN`
- **AppointmentStatus**: `AKTIF` | `IPTAL`

## Entity: User

Sisteme giriş yapabilen kişi.

| Alan | Tip | Kısıt / Not |
|------|-----|-------------|
| id | Int (autoincrement) | Birincil anahtar |
| name | String | Zorunlu |
| email | String | Zorunlu, **benzersiz** |
| password | String | Zorunlu, yalnızca bcrypt hash saklanır |
| role | Role | Varsayılan `HASTA` |
| createdAt | DateTime | Varsayılan now() |

**İlişkiler**:
- `doctorProfile`: DOKTOR rolündeki bir User'ın bir `Doctor` kaydı olabilir (1:1, opsiyonel).
- `appointments`: Bir HASTA olarak alınan randevular (1:N, `Appointment.patientId`).

**Doğrulama kuralları**:
- email format doğrulaması ve benzersizliği (FR-001).
- Kayıtta role atanmaz; varsayılan HASTA (FR-001). DOKTOR/ADMIN seed ile atanır.

## Entity: Department

Hastane bölümü / poliklinik.

| Alan | Tip | Kısıt / Not |
|------|-----|-------------|
| id | Int (autoincrement) | Birincil anahtar |
| name | String | Zorunlu |
| description | String | Opsiyonel |

**İlişkiler**:
- `doctors`: Bölüme bağlı doktorlar (1:N).

## Entity: Doctor

Randevu verilebilen hekim. Bir User'a ve bir Department'a bağlıdır.

| Alan | Tip | Kısıt / Not |
|------|-----|-------------|
| id | Int (autoincrement) | Birincil anahtar |
| userId | Int | `User.id`'ye FK, **benzersiz** (1:1) |
| departmentId | Int | `Department.id`'ye FK |
| title | String | Ünvan (ör. "Uzm. Dr.", "Prof. Dr.") |

**İlişkiler**:
- `user`: İlgili User (rol DOKTOR).
- `department`: Bağlı olduğu bölüm.
- `appointments`: Doktora atanmış randevular (1:N, `Appointment.doctorId`).

## Entity: Appointment

Bir hasta ile bir doktor arasındaki, belirli tarih ve 30 dk slot için planlanmış görüşme.

| Alan | Tip | Kısıt / Not |
|------|-----|-------------|
| id | Int (autoincrement) | Birincil anahtar |
| patientId | Int | `User.id`'ye FK (rol HASTA) |
| doctorId | Int | `Doctor.id`'ye FK |
| date | DateTime (veya Date) | Randevu günü (gün bazında) |
| timeSlot | String | "HH:mm" formatı, 30 dk slot (ör. "09:30") |
| status | AppointmentStatus | Varsayılan `AKTIF` |
| createdAt | DateTime | Varsayılan now() |

**İlişkiler**:
- `patient`: Randevuyu alan User (HASTA).
- `doctor`: Randevunun atandığı Doctor.

**Doğrulama & iş kuralları** (uygulama katmanında zorlanır):
- Slot değeri geçerli slot kümesinden olmalı: {09:00, 09:30, ..., 16:30} (FR-008).
- `date`+`timeSlot` geçmişte olamaz (FR-014).
- Aynı `doctorId`+`date`+`timeSlot` için birden fazla `AKTIF` olamaz (FR-013).
- Aynı `patientId`+`date`+`timeSlot` için birden fazla `AKTIF` olamaz (FR-012).
- İptal, `status`'u `IPTAL`'e çeker; kayıt silinmez, böylece slot yeniden boşa çıkar (FR-015, FR-016).

## Entity: Notification

Kullanıcıya düşen in-app bildirim (çan). Randevu/izin/değerlendirme olaylarında sunucuda
**best-effort** üretilir (`utils/notify.js`); üretim hatası ana işlemi bozmaz.

| Alan | Tip | Kısıt / Not |
|------|-----|-------------|
| id | Int (autoincrement) | Birincil anahtar |
| userId | Int | `User.id`'ye FK (bildirimin alıcısı) |
| type | String | Olay tipi (aşağıdaki liste) |
| title | String | Kısa başlık |
| body | String | Açıklama metni |
| link | String? | Frontend rota (ör. "/appointments") |
| appointmentId | Int? | İlgili randevu (hatırlatma idempotency + derin bağlantı) |
| readAt | DateTime? | Okunduysa doldurulur |
| createdAt | DateTime | Varsayılan now() |

**İndeksler**: `(userId, readAt)`, `(userId, createdAt)`.

**Tipler**: `RANDEVU_OLUSTURULDU`, `RANDEVU_IPTAL`, `RANDEVU_TAMAMLANDI`, `RANDEVU_HATIRLATMA`,
`RANDEVU_AKTARILDI`, `IZIN_TALEBI`, `IZIN_KARARI`, `YENI_DEGERLENDIRME`.

**Olay → alıcı**:
- Randevu oluşturuldu → doktor (yeni randevu) + hasta (onay).
- Randevu iptal → iptali hasta yaptıysa doktora, doktor/admin yaptıysa hastaya.
- Randevu tamamlandı → hasta (değerlendirme daveti).
- Randevu hatırlatma (24s, cron) → hasta. `appointmentId` ile idempotent (mükerrer üretilmez).
- İzin talebi → tüm ADMIN'ler. İzin kararı → talebi açan doktor.
- İzinden/doktor silinmesinden etkilenen randevular → ilgili hastalar (aktarıldı/iptal edildi).
- Yeni değerlendirme → doktor.

## Çakışma / Benzersizlik Stratejisi

- Uygulama katmanı: randevu oluşturmadan önce `AKTIF` çakışma sorguları (doktor ve hasta için).
- Veritabanı katmanı (ikinci savunma): `(doctorId, date, timeSlot)` üzerinde benzersizlik
  hedeflenir. IPTAL kayıtları benzersizliği bloke etmemelidir; bu, ya iptalde kaydın silinmesi
  yerine kısıtın yalnızca AKTIF kayıtlar için mantıksal olarak yorumlanmasıyla ya da eşdeğer bir
  yaklaşımla sağlanır. MVP için birincil güvence uygulama katmanı kontrolüdür; DB kısıtı yarış
  durumuna karşı yardımcıdır.

## State Transitions: Appointment.status

```text
(oluşturma) ──> AKTIF ──(hasta iptal eder)──> IPTAL  [terminal]
```

- AKTIF → IPTAL: yalnızca randevunun sahibi hasta tarafından (FR-015).
- IPTAL terminaldir; yeniden aktifleştirme MVP kapsamı dışıdır.

## İlişki Özeti (ER)

```text
User (1) ──< (N) Appointment (patient)
Department (1) ──< (N) Doctor
User (1) ──(1) Doctor
Doctor (1) ──< (N) Appointment
```
