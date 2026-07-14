# Feature Specification: Hastane Randevu Sistemi (MVP)

**Feature Branch**: `001-hastane-randevu`

**Created**: 2026-07-13

**Status**: Draft

**Input**: User description: "Hastane Randevu Sistemi (MVP). Backend REST API + Frontend SPA. Roller: HASTA, DOKTOR, ADMIN. Kimlik doğrulama, bölüm/doktor listeleme, 30 dakikalık slotlarla randevu motoru, randevu oluşturma ve iptal, hasta 'Randevularım' ekranı, doktor kendi randevularını görme."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hasta Olarak Randevu Alma (Priority: P1)

Bir hasta sisteme kayıt olur, giriş yapar, ilgilendiği bölümü ve o bölümdeki bir doktoru
seçer, bir tarih belirler, o tarih için boş 30 dakikalık zaman dilimlerini görür ve uygun
bir dilimi seçerek randevusunu oluşturur.

**Why this priority**: Sistemin var oluş nedeni budur. Bu akış tek başına çalışırsa, ürün
temel değeri (randevu alma) sunar ve MVP olarak gösterilebilir.

**Independent Test**: Yeni bir hasta hesabı oluşturup giriş yaparak, bir doktor ve tarih
seçip boş bir slottan randevu alınabildiği baştan sona doğrulanabilir.

**Acceptance Scenarios**:

1. **Given** kayıtlı olmayan bir kullanıcı, **When** geçerli ad, e-posta ve parola ile kayıt
   olur, **Then** hesabı HASTA rolüyle oluşturulur ve giriş yapabilir.
2. **Given** giriş yapmış bir hasta, **When** bir bölüm seçer, **Then** o bölüme ait doktorların
   listesini görür.
3. **Given** bir doktor ve gelecekteki bir tarih seçili, **When** hasta uygun slotları ister,
   **Then** o gün için 09:00–16:30 arası, dolu olmayan 30 dakikalık dilimler listelenir.
4. **Given** boş bir slot seçili, **When** hasta randevuyu onaylar, **Then** randevu AKTIF
   durumda oluşturulur ve o slot artık boş listesinde görünmez.
5. **Given** aynı doktor-tarih-slot için zaten bir AKTIF randevu var, **When** başka bir hasta
   aynı slotu almaya çalışır, **Then** işlem reddedilir ve anlaşılır bir hata mesajı gösterilir.
6. **Given** bir hasta belirli bir gün ve saat diliminde zaten bir AKTIF randevuya sahip,
   **When** aynı gün ve saat dilimi için ikinci bir randevu almaya çalışır, **Then** işlem
   reddedilir.

---

### User Story 2 - Hasta Olarak Randevularımı Görüntüleme ve İptal Etme (Priority: P2)

Giriş yapmış bir hasta, "Randevularım" ekranında kendisine ait aktif randevuları görür ve
istediği bir randevuyu iptal eder. İptal edilen randevunun zaman dilimi anında diğer hastalar
için tekrar seçilebilir hale gelir.

**Why this priority**: Randevu almanın doğal tamamlayıcısıdır; kullanıcının kendi randevularını
yönetmesini sağlar. P1 olmadan anlamlı değildir, bu yüzden P2'dir.

**Independent Test**: Bir hastanın mevcut aktif randevusu listelenebiliyor, iptal
edilebiliyor ve iptal sonrası aynı slotun başka bir hastaya tekrar açıldığı doğrulanabiliyor.

**Acceptance Scenarios**:

1. **Given** giriş yapmış, en az bir AKTIF randevusu olan hasta, **When** "Randevularım"
   ekranını açar, **Then** yalnızca kendi aktif randevularını (doktor, bölüm, tarih, saat)
   görür.
2. **Given** hastanın bir AKTIF randevusu, **When** hasta bu randevuyu iptal eder, **Then**
   randevunun durumu IPTAL olur ve listede aktif olarak görünmez.
3. **Given** iptal edilmiş bir slot, **When** başka bir hasta aynı doktor-tarih için boş
   slotları görüntüler, **Then** iptal edilen slot yeniden boş olarak listelenir.
4. **Given** bir hasta, **When** başka bir hastanın randevusunu iptal etmeye çalışır, **Then**
   işlem yetkisiz olarak reddedilir.

---

### User Story 3 - Doktor Olarak Kendi Randevularımı Görüntüleme (Priority: P3)

Giriş yapmış bir doktor, kendisine atanmış aktif randevuları tarih/saat sıralı bir liste
(ajanda) olarak görür.

**Why this priority**: Doktor tarafına görünürlük sağlar ancak randevu akışının çalışması için
zorunlu değildir; bu yüzden en düşük önceliktedir.

**Independent Test**: Doktor rolüyle giriş yapıldığında yalnızca o doktora ait randevuların
listelendiği doğrulanabilir.

**Acceptance Scenarios**:

1. **Given** kendisine atanmış randevuları olan bir doktor, **When** ajanda ekranını açar,
   **Then** yalnızca kendisine ait randevuları tarih ve saate göre sıralı görür.
2. **Given** giriş yapmış bir doktor, **When** başka bir doktorun randevularını görmeye
   çalışır, **Then** yalnızca kendi randevularına erişebilir.

---

### Edge Cases

- Hasta geçmiş bir tarih veya bugüne ait ancak şu andan önceki bir saat dilimi için randevu
  almaya çalışırsa işlem reddedilir.
- Seçilen gün ve doktor için hiç boş slot kalmadıysa, boş slot listesi boş döner ve kullanıcıya
  "uygun slot yok" bilgisi gösterilir.
- Aynı slota neredeyse eş zamanlı iki talep gelirse, yalnızca biri başarılı olur; ikincisi
  "slot dolu" hatası alır.
- Geçersiz kimlik bilgileriyle giriş denenirse, kullanıcıya kimin hatalı olduğunu açık etmeyen
  genel bir "geçersiz e-posta veya parola" mesajı döner.
- Yetkisiz (giriş yapmamış) bir kullanıcı korumalı bir işlem (randevu alma/iptal, ajanda)
  yapmaya çalışırsa erişim reddedilir.

## Requirements *(mandatory)*

### Functional Requirements

**Kimlik Doğrulama ve Roller**

- **FR-001**: Sistem, kullanıcıların ad, e-posta ve parola ile kayıt olmasını (register)
  sağlamalı ve yeni kayıtları varsayılan olarak HASTA rolüyle oluşturmalıdır.
- **FR-002**: Sistem, e-posta ve parola ile giriş (login) yapılmasını sağlamalı ve başarılı
  girişte kimliği doğrulanmış bir oturum sağlamalıdır.
- **FR-003**: Sistem, kullanıcı parolalarını asla düz metin olarak saklamamalı; yalnızca
  geri döndürülemez şekilde şifrelenmiş (hash) biçimde tutmalıdır.
- **FR-004**: Sistem, kullanıcıları rollerine göre ayırt etmelidir: HASTA, DOKTOR, ADMIN.
- **FR-005**: Sistem, korumalı işlemleri yalnızca kimliği doğrulanmış ve uygun role sahip
  kullanıcılara açmalıdır (randevu alma/iptal yalnızca ilgili hasta; ajanda yalnızca ilgili
  doktor).

**Bölüm ve Doktor Listeleme**

- **FR-006**: Sistem, mevcut bölümlerin (Department) listesini sunmalıdır.
- **FR-007**: Sistem, doktorların listesini ve her doktorun bağlı olduğu bölüm ile ünvan
  bilgisini sunmalı; belirli bir bölüme göre filtrelenebilmesini sağlamalıdır.

**Randevu Motoru (Boş Slot Hesabı)**

- **FR-008**: Sistem, randevu zaman dilimlerini 30 dakikalık slotlar halinde tanımlamalıdır:
  09:00, 09:30, ... , 16:30 (mesai penceresi 09:00–17:00; son slot 16:30–17:00).
- **FR-009**: Sistem, verilen bir doktor ve tarih için, o güne ait AKTIF randevularla dolu
  olmayan boş slotları hesaplayıp listelemelidir.
- **FR-010**: Boş slot hesabı bugün için yapılırken, o an itibarıyla geçmiş kalan saat
  dilimleri boş listesinde gösterilmemelidir.

**Randevu Oluşturma ve İptal**

- **FR-011**: Sistem, bir hastanın seçtiği doktor, tarih ve boş slot için AKTIF durumda bir
  randevu oluşturmasını sağlamalıdır.
- **FR-012**: Sistem, bir hastanın aynı gün için birden fazla AKTIF randevu almasını
  engellemelidir (bir hasta bir günde en fazla bir aktif randevuya sahip olabilir).
- **FR-013**: Sistem, bir doktorun aynı gün ve aynı saat diliminde birden fazla hastaya
  (birden fazla AKTIF randevu) atanmasını engellemelidir.
- **FR-014**: Sistem, geçmiş bir tarihe veya bugüne ait geçmiş bir saat dilimine randevu
  oluşturulmasını engellemelidir.
- **FR-015**: Sistem, bir randevunun yalnızca sahibi hasta veya bir ADMIN tarafından iptal
  edilmesine izin vermeli; iptalde randevu durumu IPTAL yapılmalı ve satır silinmemelidir.
- **FR-016**: İptal edilen bir randevunun zaman dilimi, aynı doktor-tarih için diğer hastalara
  anında yeniden boş slot olarak sunulmalıdır.

**Randevu Görüntüleme**

- **FR-017**: Sistem, bir hastaya kendisine ait tüm randevuları (AKTIF ve IPTAL; doktor, bölüm,
  tarih, saat, durum) tarihe göre yeniden eskiye sıralı listelemelidir. Böylece hasta geçmiş
  (iptal edilmiş) randevularını da görebilir.
- **FR-018**: Sistem, bir doktora yalnızca kendisine atanmış randevuları tarih ve saate göre
  sıralı bir liste (ajanda) olarak sunmalıdır.

**Hata Yönetimi**

- **FR-019**: Sistem, iş kuralı ihlallerini (dolu slot, çift randevu, geçmiş tarih, yetkisiz
  erişim) anlaşılır ve tutarlı hata bildirimleriyle kullanıcıya iletmelidir; ham sistem/iç
  hata detayları kullanıcıya sızdırılmamalıdır. Tüm API yanıtları `{ success, message, data }`
  (hata: `{ success, message }`) biçiminde standarttır.

**Yönetici İşlemleri (Admin — yönetici talebi)**

- **FR-020**: Sistem, yeni bölüm ve doktor oluşturma işlemlerine yalnızca ADMIN rolündeki
  kullanıcıların erişmesine izin vermeli; kimliği doğrulanmamış veya ADMIN olmayan istekler
  reddedilmelidir.

**Hizmet Değerlendirmesi (Review — yönetici talebi)**

- **FR-021**: Sistem, bir hastanın yalnızca kendisine ait, tarihi geçmiş (gerçekleşmiş) ve
  iptal edilmemiş (AKTIF) bir randevu için 1–5 arası bir puan (rating) ve yorum (comment)
  içeren bir değerlendirme bırakmasına izin vermelidir. Her randevu için en fazla bir
  değerlendirme yapılabilir (appointmentId benzersiz).

**E-posta Bildirimi (yönetici talebi)**

- **FR-022**: Sistem, bir randevu oluşturulduğunda ve iptal edildiğinde hastaya bilgilendirme
  e-postası göndermelidir. E-posta gönderim hatası ana işlemi (randevu oluşturma/iptal)
  başarısız kılmamalıdır (best-effort).
- **FR-023**: Sistem, zamanı 24 saatten az kalmış AKTİF randevular için hastaya bir hatırlatma
  e-postası göndermeli ve her randevu için yalnızca bir kez göndermelidir (mükerrer engeli).
  Bu, zamanlanmış bir görevle (cron) yürütülür.

### Key Entities *(include if feature involves data)*

- **User (Kullanıcı)**: Sisteme giriş yapabilen kişi. Nitelikler: ad, e-posta (benzersiz),
  şifrelenmiş parola, rol (HASTA/DOKTOR/ADMIN), oluşturulma zamanı.
- **Department (Bölüm)**: Hastane bölümü/poliklinik. Nitelikler: ad, açıklama. Birden çok
  doktor içerebilir.
- **Doctor (Doktor)**: Randevu verilebilen hekim. Bir User'a ve bir Department'a bağlıdır.
  Nitelikler: ünvan (title). Birden çok randevuya sahip olabilir.
- **Appointment (Randevu)**: Bir hasta ile bir doktor arasındaki, belirli bir tarih ve 30
  dakikalık zaman dilimi için planlanmış görüşme. Nitelikler: hasta (User/HASTA), doktor,
  tarih, zaman dilimi (timeSlot), durum (AKTIF/IPTAL), oluşturulma zamanı.
- **Review (Değerlendirme)**: Gerçekleşmiş bir randevu için hastanın doktora bıraktığı
  değerlendirme. Bir randevuya birebir bağlıdır (appointmentId benzersiz). Nitelikler: hasta,
  doktor, puan (rating 1–5), yorum (comment), oluşturulma zamanı.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Yeni bir hasta, kayıt olmaktan randevu oluşturmaya kadar tüm akışı 3 dakikanın
  altında tamamlayabilir.
- **SC-002**: Bir doktor ve tarih seçildiğinde, boş slot listesi kullanıcıya anında (1 saniye
  içinde algılanan gecikmeyle) görünür.
- **SC-003**: Aynı doktor-tarih-slot için ikinci bir randevu talebi %100 oranında reddedilir;
  hiçbir çakışan çift randevu oluşmaz.
- **SC-004**: İptal edilen bir slot, iptalden sonraki ilk sorguda %100 oranında yeniden boş
  slot olarak listelenir.
- **SC-005**: Geçmiş tarih/saat için yapılan randevu talepleri %100 oranında reddedilir.
- **SC-006**: Bir kullanıcı yalnızca kendi verilerine erişebilir; başka bir kullanıcının
  randevusunu görüntüleme/iptal girişimlerinin tamamı reddedilir (ADMIN iptal istisnadır).
- **SC-007**: ADMIN olmayan hiçbir istek bölüm/doktor oluşturamaz (%100 reddedilir).
- **SC-008**: Bir hasta yalnızca kendisine ait, geçmiş ve AKTIF bir randevu için, randevu
  başına en fazla bir kez 1–5 arası değerlendirme bırakabilir.

## Assumptions

- Kullanıcı arayüzü tek dilli (Türkçe) ve masaüstü/web tarayıcı odaklıdır; mobil özel
  optimizasyon bu sürümde kapsam dışıdır.
- Mesai penceresi tüm doktorlar için sabit 09:00–17:00'dir; doktora özel çalışma saatleri,
  izin/tatil günleri ve mola tanımları bu sürümde kapsam dışıdır.
- Randevu süresi sabit 30 dakikadır ve slotlar tüm bölümler için aynıdır.
- ADMIN rolü bölüm ve doktor oluşturma API uçlarına erişebilir (yönetici talebi); ayrı bir
  yönetim paneli UI ekranı bu sürümde kapsam dışıdır. Başlangıç verisi (bölümler, doktorlar)
  ayrıca hazır tohum (seed) verisiyle de yüklenir.
- Zaman ve tarih hesapları sunucunun tek bir referans saat dilimine göre yapılır; çoklu saat
  dilimi desteği kapsam dışıdır.

### Kapsam Dışı (Out of Scope — v1)

Aşağıdaki özellikler "Sadece İsteneni Yap" prensibi gereği bu MVP'de **geliştirilmeyecektir**:
online ödeme, SMS bildirimleri, randevu erteleme/güncelleme, doktorun randevu
oluşturması/iptali ve raporlama.

**Kapsama alındı (yönetici talepleri):** ADMIN'in bölüm/doktor oluşturması (API + panel UI),
hizmet değerlendirmesi (Review), randevu oluşturma/iptalde bilgilendirme e-postası, **ADMIN
yönetim paneli UI** (bölüm/doktor yönetimi) ve **randevu öncesi hatırlatma e-postası** (cron).
✅ Faz 4 tamamlandı — tüm proje gereksinimleri karşılandı.
