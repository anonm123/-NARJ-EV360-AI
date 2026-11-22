# Vercel'de yayına alma (telefondan yapılabilir)

Gerekenler: GitHub hesabı. Vercel'in **Hobby** planı ücretsizdir ve kredi kartı istemez.

## 1. Siteyi yayına al (~5 dakika)
1. Telefonun tarayıcısında **vercel.com/signup** adresini açın → **Continue with GitHub** → GitHub'a giriş yapıp izin verin. Plan sorulursa **Hobby** seçin.
2. **Add New… → Project** (veya **Import Git Repository**) → `anonm123/-NARJ-EV360-AI` deposunun yanında **Import**.
   - Depo listede yoksa **Adjust GitHub App Permissions** ile Vercel'e bu depoya erişim verin.
3. Ayarlar ekranında:
   - **Framework Preset:** Next.js (otomatik seçilir). Build ve Output ayarlarına dokunmayın.
   - **Environment Variables** bölümünü açıp bir satır ekleyin (isteğe bağlı ama önerilir):
     | Key | Value |
     |---|---|
     | `NARJ_SEED_DEMO` | `1` |

     Bu, demo **sürücü** ve **filo** hesaplarını açar (parola `NarjDemo!2026`). Yönetici demo hesabı güvenlik nedeniyle yayında açılmaz.
4. **Deploy** düğmesine basın. 1–2 dakika sonra `https://<proje-adı>.vercel.app` adresli siteniz hazır olur.

Bundan sonra `main` dalına birleştirilen her değişiklik otomatik olarak yeniden yayına alınır; PR'lar için ayrı önizleme adresleri oluşur.

## 2. Kayıtların kalıcı olması (isteğe bağlı, ücretsiz)
Varsayılan olarak veriler sunucunun geçici `/tmp` klasöründe tutulur. Site çalışır, ama yeni kayıtlar, rezervasyonlar ve oturumlar sunucu yenilenince silinebilir ve bazen yeniden giriş gerekebilir. Kalıcı yapmak için:

1. Vercel'de projenize girin → **Storage** sekmesi → **Upstash for Redis** (Marketplace) → **Create** → ücretsiz planı seçin → projeye bağlayın.
2. Entegrasyon `KV_REST_API_URL` ve `KV_REST_API_TOKEN` değişkenlerini projeye otomatik ekler. Kod bunları kendiliğinden tanır, ek ayar gerekmez.
3. **Deployments** sekmesinde son yayının **⋯ → Redeploy** seçeneğiyle yeniden yayına alın.

Upstash'in ücretsiz planı bu demo için yeterlidir. Ücretli bir plana geçmeyin; sınır aşılırsa yalnızca yeni yazma istekleri reddedilir.

## Notlar
- Ödeme sayfası **demodur**; gerçek ödeme alınmaz ve kart bilgisi saklanmaz.
- Harita altlığı CARTO'nun ücretsiz karolarını kullanır; ticari kullanımda koşulları gözden geçirin.
- Redis arka ucu demo içindir: tüm veri tek bir anahtarda JSON olarak tutulur. Gerçek kullanıcılı bir yayında PostgreSQL'e geçilmesi önerilir (bkz. `SECURITY.md`).
