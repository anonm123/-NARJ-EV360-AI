# NAR-J EV360-AI · Yolun Akıllı Gücü

Yapay zekâ destekli elektrikli araç şarjı, rota optimizasyonu, enerji yönetimi ve filo SaaS platformu (lansman öncesi).

**Teknoloji:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui tarzı bileşenler (Radix) · Lucide · Motion · Leaflet · Recharts · Zod · Vitest · Playwright

## Hızlı başlangıç

```bash
npm install
npm run dev            # http://localhost:3000
```

Geliştirme ortamında demo hesaplar otomatik oluşturulur (parola `NarjDemo!2026`):

| Hesap | Rol |
|---|---|
| `surucu@narj.dev` | Bireysel sürücü |
| `filo@narj.dev` | Filo yöneticisi (örnek filo verisi) |
| `admin@narj.dev` | Platform yöneticisi |

Üretim modunda demo hesaplar **kapalıdır**; `NARJ_SEED_DEMO=1` ile sürücü ve filo hesapları açılır. Yönetici demo hesabı üretimde yalnızca `NARJ_SEED_DEMO_ADMIN=1` ile açılır.

**Yayına alma:** Vercel'de (telefondan da) adım adım kurulum için [docs/DEPLOY.md](docs/DEPLOY.md).

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run build && npm start` | Üretim derlemesi ve sunucu |
| `npm test` | Hesaplama birim testleri (Vitest) |
| `npm run test:e2e` | Uçtan uca testler — çalışan sunucuya karşı (`BASE_URL`) |
| `npm run test:e2e:shots` | Aynı test + `docs/screenshots` ekran görüntüleri |
| `npm run render:images` | Özgün görselleri `design/renders/scene.html`'den yeniden üretir (AVIF/WebP/JPG) |
| `npm run lint` / `npm run typecheck` | Statik kontroller |
| `npm run security` | Depo güvenlik kontrolleri (anahtar sızıntısı, başlıklar, çerezler…) |

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical/OG/sitemap adresi |
| `NARJ_DATA_DIR` | `./.data` (Vercel'de `/tmp/narj-data`) | Dosya tabanlı veri deposunun klasörü |
| `NARJ_SEED_DEMO` | — | `1` ise üretimde de demo sürücü ve filo hesaplarını oluşturur |
| `NARJ_SEED_DEMO_ADMIN` | — | `1` ise üretimde demo yönetici hesabını da açar (yalnızca geçici test sunucuları için) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | — | Tanımlıysa veriler Upstash Redis'te kalıcı tutulur (`UPSTASH_REDIS_REST_URL` / `_TOKEN` de kabul edilir) |

## Sayfa yapısı

Her başlık kendi sayfasındadır; ana sayfa yalnızca özet ve yönlendirme içerir.

- `/` sinematik hero, marka hikâyesi, modül bento ızgarası, hızlı hesap, filo bandı, mobil önizleme
- **Platform:** `/harita`, `/rota`, `/hesaplayici`, `/garaj`, `/rezervasyon`, `/asistan`, `/mobil`
- **Çözümler:** `/operatorler`, `/rfid`, `/filo`, `/analitik`, `/is-ortakligi`
- **Şirket:** `/abonelik`, `/yatirimci`, `/hakkimizda`, `/iletisim`
- **Yasal:** `/yasal/gizlilik`, `/yasal/kvkk`, `/yasal/kullanim-kosullari`
- **Hesap:** `/giris`, `/kayit`
- **Kişisel panel (oturum gerekli):** `/panel`, `/panel/garaj`, `/panel/rotalar`, `/panel/rezervasyonlar`, `/panel/profil`, `/panel/filo` (filo/admin), `/panel/yonetim` (admin)

## Gerçek olan / demo olan

Her modülde küçük durum etiketleri kullanılır: **Çalışıyor**, **Beta**, **Demo**, **Örnek veri**, **Model**, **Planlı**.

| Alan | Durum |
|---|---|
| Şarj, rota, karbon, gelir hesaplamaları | Gerçekten hesaplanır (birim testli) |
| Hesap sistemi, kişisel panel, garaj, rota kaydı, profil/parola, rol yetkileri | Çalışır (dosya tabanlı depo) |
| Erken erişim formu | Çalışır, yönetim panelinde listelenir |
| Harita istasyonları, doluluk, operatör tarifeleri | **Örnek / simülasyon** — gerçek istasyon değildir |
| Rezervasyon & ödeme | **Demo** — Luhn doğrulaması var, ödeme alınmaz, kart saklanmaz |
| AI asistan | **Beta** — kural tabanlı, platformun hesap motorlarını kullanır; LLM entegrasyonu planlı |
| Operatör API adaptörleri | Ortak arayüz + demo adaptör; OCPI istemcisi planlı |
| RFID / tek ödeme, mobil uygulama | Vizyon / planlı |

## CI/CD

Her push ve PR'da GitHub Actions; lint, tip kontrolü, birim testleri, üretim derlemesi, güvenlik kontrolleri, CodeQL ve mobil + masaüstü uçtan uca testleri çalıştırır. Ayrıntı: [docs/CI.md](docs/CI.md).

Ayrıntılar: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/SECURITY.md](docs/SECURITY.md) · [docs/TEST-REPORT.md](docs/TEST-REPORT.md)
