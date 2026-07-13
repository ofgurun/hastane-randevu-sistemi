# Phase 0 Research: Hastane Randevu Sistemi (MVP)

Bu belge, Technical Context'teki teknoloji seçimlerini ve açık kalan kararları gerekçeleriyle
sabitler. MVP kapsamı ve "Sadece İsteneni Yap" ilkesi tüm kararların üzerindedir.

## Karar 1: Veritabanı ve ORM

- **Decision**: Prisma ORM + PostgreSQL (varsayılan; MySQL de desteklenir, yalnızca
  `DATABASE_URL` ve `provider` değişir).
- **Rationale**: Prisma, şema-öncelikli modelleme, tip güvenli sorgular ve kolay migration
  sağlar; MVP'de hızlı kurulum ve okunabilir veri erişimi sunar. PostgreSQL yaygın ve ücretsiz.
- **Alternatives considered**: Ham SQL / Knex (daha çok kalıp kod), Sequelize (daha ağır API,
  daha zayıf tip desteği). Prisma bu ölçek için en hızlı geliştirme deneyimini verir.

## Karar 2: Kimlik Doğrulama (JWT + bcryptjs)

- **Decision**: Parolalar bcryptjs ile hash'lenir; giriş başarılıysa `jsonwebtoken` ile
  imzalı bir JWT üretilir. Token istemcide `localStorage`'da tutulur ve her istekte
  `Authorization: Bearer <token>` başlığıyla gönderilir.
- **Rationale**: Anayasa yığınıyla birebir. Stateless JWT, ayrı oturum deposu gerektirmez;
  MVP için en düşük altyapı maliyetli çözüm. bcryptjs saf JS olduğundan derleme bağımlılığı yok.
- **Alternatives considered**: Sunucu tarafı session + cookie (ek durum yönetimi), OAuth/SSO
  (MVP için aşırı). Token TTL varsayılan makul bir süre (ör. 1 gün) olarak ayarlanır.

## Karar 3: Slot Modeli ve Randevu Motoru

- **Decision**: Slotlar sabit 30 dakikalık dilimler olarak üretilir: 09:00, 09:30, ..., 16:30
  (mesai 09:00–17:00; son slot 16:30). `timeSlot` alanı "HH:mm" formatında string olarak
  saklanır. Boş slotlar = tüm slot kümesi − (ilgili doktor+tarih için AKTIF randevuların
  timeSlot'ları). Bugün için, `date` bugünse geçmiş saatler listeden çıkarılır.
- **Rationale**: Sabit slot kümesi hesabı O(n) ve basittir; doktora özel takvim motoruna
  ihtiyaç yok. String "HH:mm" karşılaştırması hem depolama hem UI için sade.
- **Alternatives considered**: Serbest zaman aralığı/çakışma motoru (aşırı karmaşık, kapsam
  dışı), her slotu ayrı satır olarak önceden materialize etmek (gereksiz veri şişmesi).

## Karar 4: Çift Randevu ve Çakışma Kontrolü

- **Decision**: Randevu oluşturmadan önce iki kontrol yapılır: (a) aynı doktor+date+timeSlot
  için AKTIF randevu var mı? (b) aynı hasta+date+timeSlot için AKTIF randevu var mı? İkisi de
  yoksa oluşturulur. Veritabanı düzeyinde `(doctorId, date, timeSlot)` üzerinde bir benzersizlik
  kısıtı, IPTAL kayıtlarıyla çakışmayacak şekilde ele alınır (yaklaşım data-model.md'de).
- **Rationale**: Uygulama katmanı kontrolü hızlı ve okunur; DB kısıtı yarış durumlarına karşı
  ikinci savunma hattıdır (SC-003). İptal edilen randevular AKTIF olmadığından slotu bloke etmez
  (SC-004, FR-016).
- **Alternatives considered**: Yalnızca uygulama katmanı kontrolü (yarış durumu riski), her slot
  için satır kilidi (MVP ölçeği için gereksiz).

## Karar 5: Frontend Yığını (React + Vite + Zustand + Axios + MUI)

- **Decision**: React (Vite) SPA; global auth durumu Zustand ile; API çağrıları Axios ile;
  token'ı otomatik ekleyen bir Axios request interceptor; UI için MUI (varsayılan). Yönlendirme
  React Router; korumalı sayfalar `ProtectedRoute` sarmalayıcısıyla.
- **Rationale**: Anayasa yığınıyla birebir. Zustand minimal boilerplate ile auth state sağlar;
  Axios interceptor tek noktadan token yönetimi verir. MUI hazır bileşenlerle hızlı UI kurar.
- **Alternatives considered**: Redux (fazla boilerplate), fetch (interceptor için elle sarmalama
  gerekir), Tailwind (geçerli alternatif; MUI hazır bileşen avantajıyla varsayılan seçildi).

## Karar 6: Hata Yönetimi Deseni

- **Decision**: Controller'lar try-catch ile sarılır; iş kuralı ihlalleri anlamlı 4xx kod ve
  `{ "error": "<mesaj>" }` gövdesiyle döner. Beklenmeyen hatalar merkezi bir `errorHandler`
  middleware'ine düşer ve genel 500 + güvenli mesaj döner (ham stack/DB hatası sızdırılmaz).
- **Rationale**: Anayasa İlke III ile birebir; frontend tutarlı hata gövdesine güvenebilir
  (toast bildirimleri için).
- **Alternatives considered**: Her controller'da tekrar eden hata biçimlendirme (DRY değil).

## Karar 7: Test/Doğrulama Yaklaşımı (MVP)

- **Decision**: Otomatik test paketi MVP kapsamı dışı. Doğrulama, quickstart.md'deki uçtan uca
  senaryolar ve manuel HTTP istekleriyle yapılır. Sunum için Prisma seed verisi hazırlanır.
- **Rationale**: 15 iş günü kısıtı ve "Sadece İsteneni Yap"; plan otomatik test istemiyor.
- **Alternatives considered**: Jest/Supertest (Gün 15'te opsiyonel eklenebilir; MVP zorunluluğu
  değil).

## Çözülen NEEDS CLARIFICATION

Bu fazda çözülmemiş NEEDS CLARIFICATION kalmamıştır. UI kütüphanesi (MUI vs Tailwind) için MUI
varsayılan olarak sabitlenmiştir; değiştirilmek istenirse yalnızca frontend bileşen katmanını
etkiler ve API sözleşmesini değiştirmez.
