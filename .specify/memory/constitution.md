<!--
Sync Impact Report
==================
Version change: (none) → 1.0.0
Rationale: Initial ratification of the project constitution.

Modified principles: N/A (initial creation)
Added principles:
  - I. Sadece İsteneni Yap (Scope Discipline)
  - II. Modüler Kod (Modular Architecture)
  - III. Hata Yönetimi (Robust Error Handling)
  - IV. Adım Adım İlerle (Incremental Delivery)
Added sections:
  - Teknoloji Yığını ve Kısıtlar (Technology Stack & Constraints)
  - Geliştirme İş Akışı (Development Workflow)

Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check aligns; no change required)
  - ✅ .specify/templates/spec-template.md (scope/requirements compatible; no change required)
  - ✅ .specify/templates/tasks-template.md (task categories compatible; no change required)

Follow-up TODOs: none
-->

# Hastane Randevu Sistemi Constitution

Bu anayasa, 15 iş günü sürecek staj kapsamında geliştirilecek MVP seviyesindeki Hastane
Randevu Sistemi projesinin bağlayıcı kurallarını tanımlar. Tüm spesifikasyon, plan ve
görevler bu ilkelere uymak zorundadır.

## Core Principles

### I. Sadece İsteneni Yap (Scope Discipline)

Yalnızca tanımlanmış plan ve spesifikasyonda açıkça istenen özellikler kodlanır.

- Plan dışı hiçbir ek özellik, "gelecekte lazım olur" gerekçesiyle bile eklenMEZ.
- Belirtilmemiş bir gereksinim ortaya çıkarsa, varsayımla uygulamak yerine önce açıklığa
  kavuşturulur (clarify) ve spesifikasyona işlenir.
- MVP kapsamı korunur; kapsam genişletme (scope creep) bir kusur olarak değerlendirilir.

**Gerekçe**: Süre 15 iş günü ile sınırlıdır. Fazladan özellik, temiz ve çalışabilir bir
ürünü tamamlama riskini artırır. Kapsam disiplini, teslim edilebilirliği garanti eder.

### II. Modüler Kod (Modular Architecture)

Kod, sorumlulukların net biçimde ayrıldığı katmanlı bir yapıda yazılır.

- Backend katmanları AYRILIR: `controllers`, `routes`, `models` (Prisma şeması/erişimi),
  `middlewares`.
- Frontend katmanları AYRILIR: `components`, `pages`, `services` (API çağrıları),
  `store` (Zustand durumu).
- İş mantığı controller/service katmanında toplanır; route dosyaları yalnızca yönlendirme
  yapar. UI bileşenleri doğrudan HTTP çağrısı yapMAZ, `services` katmanını kullanır.

**Gerekçe**: Modülerlik, kısa sürede birden fazla ekranın ve API ucunun paralel
geliştirilmesini, test edilmesini ve bakımını mümkün kılar.

### III. Hata Yönetimi (Robust Error Handling)

Tüm API uçları öngörülebilir ve tutarlı hata davranışı sergiler.

- Her API ucunda `try-catch` (veya eşdeğer merkezi hata middleware'i) kullanılır.
- Hatalar JSON formatında, anlaşılır bir mesaj ve uygun HTTP durum kodu ile döner
  (ör. `{ "error": "..." }`, 400/401/403/404/409/500).
- İş kuralı ihlalleri (çift randevu, geçmiş tarih vb.) 500 değil, anlamlı istemci hata
  kodlarıyla (4xx) döner. Ham stack trace veya veritabanı hataları istemciye sızDIRILMAZ.

**Gerekçe**: Tutarlı hata yönetimi, frontend'in güvenilir davranmasını ve iş kurallarının
kullanıcıya açık biçimde iletilmesini sağlar.

### IV. Adım Adım İlerle (Incremental Delivery)

Geliştirme, 15 günlük planın gün sırasına sadık kalınarak yürütülür.

- Planlanan bir günün görevleri tamamlanmadan bir sonraki güne GEÇİLMEZ.
- Backend fazı (Gün 1-5) frontend fazından (Gün 6-10) önce tamamlanır; doktor paneli ve
  cila fazı (Gün 11-15) en sona bırakılır.
- Her görev tamamlandığında çalışabilir/doğrulanabilir bir durum bırakılır.

**Gerekçe**: Sıralı ilerleme, bağımlılıkların (ör. Auth API olmadan Auth ekranı) doğru
sırada karşılanmasını ve her aşamada test edilebilir bir ürün olmasını sağlar.

## Teknoloji Yığını ve Kısıtlar (Technology Stack & Constraints)

Aşağıdaki teknoloji yığını bağlayıcıdır; alternatif kütüphaneler bu anayasa değiştirilmeden
kullanılMAZ:

- **Backend**: Node.js, Express.js
- **Veritabanı & ORM**: PostgreSQL veya MySQL, Prisma ORM ile
- **Frontend**: React (Vite altyapısı)
- **UI**: Material UI (MUI) veya Tailwind CSS
- **Durum Yönetimi**: Zustand
- **HTTP İstemcisi**: Axios
- **Kimlik Doğrulama**: JWT ve bcryptjs (parolalar daima hash'lenir; düz metin saklanMAZ)

Veri modelleri: `User`, `Department`, `Doctor`, `Appointment`. Roller: `HASTA`, `DOKTOR`,
`ADMIN`. Randevu durumları: `AKTIF`, `IPTAL`.

## Geliştirme İş Akışı (Development Workflow)

- Çalışma sırası spesifikasyon → plan → görevler → uygulama olarak Spec-Driven Development
  akışını izler.
- Depo yapısı `backend/` ve `frontend/` olarak iki köke ayrılır.
- Çekirdek iş kuralları (30 dakikalık slotlar, hasta/doktor için aynı slotta tek randevu,
  geçmiş tarihe randevu yasağı, iptal edilen slotun anında boşa çıkması) her ilgili API ucu
  ve ekranında korunmak ZORUNDADIR.
- Sunum öncesi Prisma seed verisi (5 bölüm, 10 doktor, örnek randevular) hazırlanır.

## Governance

- Bu anayasa, projedeki diğer tüm uygulama tercihlerinin üzerindedir; çelişki halinde anayasa
  esas alınır.
- Değişiklikler (amendment) dokümante edilir ve sürüm numarası semantik versiyonlama ile
  güncellenir: MAJOR (ilke kaldırma/uyumsuz değişiklik), MINOR (yeni ilke/bölüm ekleme),
  PATCH (açıklama/düzeltme).
- Her spesifikasyon, plan ve görev üretimi bu ilkelere uygunluk açısından gözden geçirilir;
  kapsam dışı veya ilkelere aykırı işler reddedilir.
- Karmaşıklık ancak açık bir gerekçe ile kabul edilir; aksi halde en basit çözüm tercih edilir.

**Version**: 1.0.0 | **Ratified**: 2026-07-13 | **Last Amended**: 2026-07-13
