# Güvenlik ve üretim öncesi kontrol listesi

## Uygulananlar
- [x] Parolalar **scrypt** (N=16384, 16 bayt tuz) ile özetlenir; karşılaştırma `timingSafeEqual`.
- [x] Parola politikası: ≥10 karakter, büyük/küçük harf ve rakam (Zod).
- [x] Oturum belirteci 32 bayt rastgele; sunucuda yalnızca **SHA-256 özeti** saklanır; 7 gün geçerlilik.
- [x] Oturum çerezi `HttpOnly`, `SameSite=Lax`, üretimde `Secure`.
- [x] Parola değişince kullanıcının tüm oturumları sonlandırılır.
- [x] Kullanıcı bulunamadığında da sahte hash doğrulaması (kullanıcı adı numaralandırmayı zorlaştırır); genel hata mesajı.
- [x] Hız sınırlama: giriş (8/10 dk/e-posta+IP), kayıt, parola değişimi, erken erişim, rezervasyon.
- [x] Tüm form girdileri sunucuda Zod ile doğrulanır; istemci doğrulamasına güvenilmez.
- [x] Server Actions: Next.js'in yerleşik Origin kontrolü (CSRF) + SameSite çerez.
- [x] Yetkilendirme sunucu tarafında (`requireUser(roles)`); kaynak sahipliği her silme/güncellemede kontrol edilir (IDOR koruması). Middleware yalnızca ön yönlendirme yapar.
- [x] Yönlendirme `next` parametresi yalnızca `/panel` ile başlayan yollara izin verir (açık yönlendirme yok).
- [x] Erken erişim formunda honeypot alanı.
- [x] Demo ödeme: kart verisi **hiçbir yerde saklanmaz/loglanmaz**; Luhn + SKT + CVC doğrulaması.
- [x] Güvenlik başlıkları: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP, üretimde HSTS; `X-Powered-By` kapalı.
- [x] Veri dosyası `0600`, klasör `0700`; `.data/` git dışında.
- [x] Demo hesaplar üretimde varsayılan olarak kapalı.
- [x] `robots.txt` ile `/panel` ve `/api` dizine eklenmez; panel sayfaları `noindex`.

## Canlıya almadan önce yapılmalı
- [ ] Dosya deposunu yönetilen **PostgreSQL**'e taşıyın (yedekleme, eşzamanlılık, şifreleme).
- [ ] Hız sınırlamayı paylaşımlı depoya (Redis/Upstash) taşıyın — süreç içi sınırlayıcı çok örnekli dağıtımda yetersizdir.
- [ ] CSP'de `'unsafe-inline'` yerine **nonce** tabanlı script politikasına geçin.
- [ ] E-posta doğrulama ve parola sıfırlama akışı ekleyin (transactional e-posta servisi gerekir — ücretli olabilir, onay gerekir).
- [ ] Yönetici hesabı için 2FA (TOTP/WebAuthn).
- [ ] Gerçek ödeme için lisanslı ödeme kuruluşu (PCI-DSS) entegrasyonu; kart verisi asla sunucudan geçmemeli (hosted fields).
- [ ] KVKK: VERBİS kaydı, aydınlatma metinlerinin hukuk onayı, veri silme talebi süreci, saklama sürelerinin otomasyonu.
- [ ] Bağımlılık taraması (`npm audit`, Dependabot) ve gizli anahtar taraması CI'a eklenmeli.
- [ ] Harita altlığı için ticari kullanım koşullarına uygun karo sağlayıcısı (CARTO ücretsiz katmanı ticari kullanımda sınırlıdır).
- [ ] Hata izleme ve denetim kayıtları (ör. Sentry — ücretli olabilir, onay gerekir).
