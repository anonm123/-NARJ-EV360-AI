# CI/CD — GitHub Actions

İş akışı: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Her PR'da, `main` dalına her push'ta ve elle (`workflow_dispatch`) çalışır. Özellik dallarındaki değişiklikler PR üzerinden test edilir; böylece aynı commit iki kez çalışmaz. Aynı PR'a yeni commit gelince eski çalışma iptal edilir.

| İş | Adımlar | Başarısızlıkta |
|---|---|---|
| **Lint · Tipler · Birim testleri · Derleme** | 1) ESLint (`--max-warnings=0`) · 2) `next typegen && tsc --noEmit` · 3) Vitest (GitHub ek açıklamaları + JUnit raporu) · 4) `next build` | Adım özet tablosu (✅/❌), satır bazlı hata ek açıklamaları, `unit-report` yapıtı |
| **Güvenlik kontrolleri** | 5a) `npm audit --audit-level=high` · 5b) `scripts/security-check.mjs`: sızmış anahtar kalıpları, takip edilen `.env`/özel anahtar/veri dosyaları, `dangerouslySetInnerHTML`/`eval`/`new Function`, istemci dosyasında sunucu kodu, `server-only` koruması, güvenlik başlıkları, çerez bayrakları, scrypt, üretimde demo hesapların kapalı olması, gerçek ödeme SDK'sı olmaması | Bulgu tablosu iş özetinde |
| **CodeQL** | GitHub'ın JavaScript/TypeScript statik güvenlik analizi | Uyarılar *Security → Code scanning* sekmesinde |
| **Uçtan uca testler (mobil + masaüstü)** | Derleme → üretim sunucusu (geçici veri klasörü, demo hesaplar açık) → `tests/e2e/smoke.mjs` | Başarısız kontroller tablosu iş özetinde; `e2e-report` yapıtında sonuç JSON'u, 390/1440 px ekran görüntüleri, hata anı görüntüsü ve sunucu günlüğü |

Uçtan uca test kapsamı: 22 herkese açık sayfa × 7 genişlik (320, 360, 390, 430, 768, 1024, 1440) için yatay taşma, bozuk görsel, konsol hatası, tek `h1`, ≤430 px'te dokunma alanı, adsız düğme, hedefsiz bağlantı, hedefi olmayan sayfa içi çapa; iç bağlantıların tümü; ana sayfa CTA'ları; mobil drawer ve masaüstü menü; erken erişim formu; kayıt (boş/zayıf parola/tekrarlanan e-posta), giriş (yanlış parola), çıkış, panel koruması, rol yetkisi, kullanıcı verisi izolasyonu; rezervasyon demo akışı; hesaplayıcı, rota, asistan, harita; güvenlik başlıkları.

## Maliyet ve güvenlik
- Yalnızca GitHub'ın kendi barındırdığı çalıştırıcılar ve resmi `actions/*` (checkout v7, setup-node v7, cache v6, upload-artifact v7) ile `github/codeql-action` v4 eylemleri kullanılır; hepsi Node 24 çalışma zamanındadır. `actions/checkout` kimlik bilgisini çalışma alanında tutmaz (`persist-credentials: false`), çünkü CI hiçbir şey push etmez; açık (public) depolarda ücretsizdir. Ücretli harici servis yoktur.
- İş akışı izinleri en düşük düzeydedir (`contents: read`; CodeQL için yalnızca `security-events: write`). Gizli anahtar (secret) gerektirmez.
- Hiçbir adım gerçek ödeme başlatmaz; rezervasyon testi yalnızca Luhn uyumlu test kartıyla demo akışını çalıştırır.

## Yerelde aynı kontroller
```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm test
npm run build
npm audit --audit-level=high && npm run security
NARJ_SEED_DEMO=1 npm start &   # ayrı terminalde
BASE_URL=http://localhost:3000 npm run test:e2e
```
