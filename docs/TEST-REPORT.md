# Test raporu

Tarih: 23 Kasım 2026 · Ortam: Linux konteyner, Node 22, Chromium (Playwright), `next build && next start` (üretim derlemesi)

## Özet

| Kontrol | Sonuç |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ hatasız |
| ESLint (next/core-web-vitals) | ✅ 0 hata, 0 uyarı |
| Üretim derlemesi | ✅ 28 rota (21 statik sayfa + panel/auth dinamik) |
| Hesaplama birim testleri (Vitest) | ✅ 41/41 |
| Uçtan uca testler (Playwright) | ✅ 31/31 kontrol |
| Bağımlılık denetimi (`npm audit`) | ✅ 0 güvenlik açığı (Next.js içindeki PostCSS `overrides` ile 8.5.33'e yükseltildi) |
| Depo güvenlik kontrolleri | ✅ bulgu yok |
| Çalışmayan düğme / bağlantı | ✅ adsız düğme, hedefsiz bağlantı veya hedefi olmayan çapa yok (23 sayfa × 7 genişlik) |
| Yatay taşma | ✅ 23 sayfa × 7 genişlik (320, 360, 390, 430, 768, 1024, 1440) → 0 px |
| Bozuk görsel | ✅ yok |
| İç bağlantılar | ✅ tüm iç bağlantılar 2xx |
| Konsol hataları | ✅ yok (harita karoları hariç, bkz. not) |
| Dokunma alanı (≤430 px) | ✅ tüm etkileşimli öğeler ≥ 36 px, butonlar ≥ 44 px |

## Hesaplama doğruluğu (tests/unit)
- Şarj: enerji = kapasite × ΔSoC; şebeke enerjisi = enerji / verim; maliyet; menzil; AC sabit güç süresi = enerji/güç; istasyon–araç güç sınırı; DC %80 sonrası yavaşlama; geçersiz girdi reddi.
- 100 km maliyeti EV vs fosil yakıt (elle hesaplanmış değerlerle).
- Rota: İstanbul–Ankara kuş uçuşu ≈ 350 km; kısa rotada durak yok; uzun rotada rezerv/varış şarjı korunur; **enerji dengesi** (başlangıç + şarj − tüketim = varış) 3 ondalıkta tutarlı; hızlı mod daha az şarj süresi, ekonomik mod daha düşük maliyet; hız/sıcaklık düzeltmesi.
- Karbon, gelir modeli (toplam = kalemler toplamı, CAGR), operatör oturum maliyeti, Luhn, asistan niyet tanıma, demo adaptör.
- UI testi: hesaplayıcıda 60 kWh, %15→%80, 10 ₺/kWh DC → **₺415** (39 kWh / 0,94 × 10 = 414,89 ₺) ekranda doğrulandı.

## Gerçek veri entegrasyonları (23 Kasım 2026, bu konteynerden)
| Test | Sonuç |
|---|---|
| `/api/route` Konya → Ankara (OSRM demo) | ✅ 269,3 km karayolu, 184 dk (fixture: tests/fixtures/osrm-konya-ankara.json) |
| `/api/route` İstanbul → Ankara (OSRM demo) | ✅ 443,4 km karayolu, 276 dk (eski kuş uçuşu tahmini 426 km kaldırıldı) |
| `/api/stations` Konya / İstanbul / Ankara | ⚠️ 0 istasyon — OCM: `OPENCHARGEMAP_API_KEY tanımlı değil`; Overpass: bu test ortamının proxy'si bağlantıyı kesiyor. Arayüz iki hatayı da kullanıcıya gösteriyor; sahte istasyon üretilmiyor. Render'da anahtar tanımlanınca yeniden test edilmeli. |
| Çok büyük bbox | ✅ HTTP 422 |
| Türkiye dışı nokta | ✅ HTTP 400 |
| Şarj planı, istasyon yoksa | ✅ "…km arasında uygun DC şarj istasyonu bulunamadı" hatası, uydurma durak yok |
| Normalizasyon / birleştirme (OCM+OSM) | ✅ birim testleri: lisanssız OCM sağlayıcısı atlanıyor, çakışmalar `conflicts[]` alanına yazılıyor |

## Uçtan uca akışlar (tests/e2e/smoke.mjs)
- Mobil drawer menü açılır, taşma yok, bağlantı ile gezinme çalışır; masaüstü mega menü gezinmesi.
- Kayıt: boş form ve zayıf parola reddedilir → güçlü parola ile kayıt → kişisel panel; oturum çerezi HttpOnly + SameSite=Lax.
- Panel sayfaları (sürücü, filo, admin) taşma/konsol/görsel denetiminden geçer; araç ekleme çalışır.
- Rol yetkisi: sürücü `/panel/yonetim`'e erişemez; çıkış sonrası panel korumalı.
- Yanlış parola genel hata mesajı verir; demo hesaplarla giriş.
- Rezervasyon: Luhn'u geçmeyen kart reddedilir, test kartıyla akış tamamlanır.
- Rota planlayıcı uzun rotada durak üretir; asistan rota sorusunu gerçek motorla yanıtlar; harita filtreleri ve Leaflet işaretçileri çalışır.
- Ana sayfa CTA'ları (mobil ve masaüstü), erken erişim formu (KVKK onayı zorunlu).
- Aynı e-postayla ikinci kayıt reddedilir; yeniden girişte kullanıcının kendi verisi görünür, başka kullanıcının verisi görünmez.
- Güvenlik başlıkları mevcut; `X-Powered-By` gizli.

CI'da bu testlerin tümü her push'ta otomatik çalışır — bkz. [CI.md](CI.md).

## Lighthouse 12 (mobil emülasyon: yavaş 4G + 4× CPU)

| Sayfa | Performans | Erişilebilirlik | En iyi uygulamalar | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | 94 | 100 | 100 | 100 | 1.4 s | 2.7 s | 0 | 150 ms |
| `/harita` | 83 | 100 | 96 | 100 | 1.4 s | 2.5 s | 0 | 550 ms |
| `/rota` | 84 | 100 | 100 | 100 | 1.4 s | 2.9 s | 0 | 440 ms |
| `/hesaplayici` | 79 | 100 | 100 | 100 | 1.4 s | 2.7 s | 0 | 680 ms |
| `/analitik` | 88 | 100 | 100 | 100 | 1.4 s | 2.9 s | 0 | 330 ms |
| `/yatirimci` | 84 | 98 | 100 | 100 | 1.4 s | 2.7 s | 0 | 480 ms |
| `/filo` | 95 | 100 | 100 | 100 | 1.4 s | 2.6 s | 0 | 160 ms |
| `/iletisim` | 89 | 100 | 100 | 100 | 1.4 s | 3.0 s | 0 | 250 ms |
| `/giris` | 95 | 100 | 100 | 91 | 1.4 s | 2.5 s | 0 | 180 ms |

Notlar:
- `/harita` en iyi uygulamalar 96: test ortamının ağı harita karo sunucusunu (CARTO) engellediği için konsol ağ hatası; normal internette bu uyarı oluşmaz.
- `/giris` SEO 91: giriş sayfası bilinçli olarak `noindex`.
- Yapılan optimizasyonlar: hero metninde opaklık animasyonu yerine yalnızca transform (LCP 4,5 sn → ~2,7 sn), `next/font/local` ile ölçü uyumlu yedek font (CLS → 0), Recharts grafiklerinin tembel yüklenmesi (rota ilk yükleme JS 318 kB → 188 kB), AVIF/WebP + responsive srcset, uzun süreli görsel önbelleği.

## Bilinen sınırlamalar
- Harita altlık karoları bu test konteynerinde ağ politikası nedeniyle yüklenmedi; Türkiye sınırı ve işaretçiler yerel veriden çizildiği için harita yine kullanılabilir. Kullanıcı tarayıcısında karolar normal yüklenir.
- Kayıt formunda React 19'un action sonrası form sıfırlaması, yük altında hızla yazılan girdiyi silebiliyordu; tüm kayıt/giriş alanları kontrollü hale getirilerek giderildi.
- Ekran görüntüleri: `docs/screenshots/` (390 px ve 1440 px, tüm sayfalar + panel + akışlar).
