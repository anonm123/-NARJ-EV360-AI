# Mimari ve teknoloji kararları

## Başlangıç durumu
Depo bu çalışma başladığında **boştu** (commit yok, uzak dalda dosya yok). Önceki HTML form tabanlı sürüm bu depoda bulunmadığından korunacak/taşınacak kod yoktu; platform istenen yığınla sıfırdan kuruldu. Önceki talimatlardaki tüm işlevler (harita & filtreler, enerji ve rota hesaplayıcı, araç profilleri, kullanıcı hesapları, AI asistan, filo paneli, gelir senaryoları, yönetici paneli, yatırımcı sayfaları, demo rezervasyon & ödeme, operatör API adaptörleri) yeniden uygulandı.

## Klasör yapısı
```
src/
  app/
    (site)/        Herkese açık sayfalar (navbar + footer layout'u, statik üretilir)
    (auth)/        Giriş / kayıt (bölünmüş ekran layout'u)
    panel/         Oturumlu kişisel panel (sidebar + mobil alt menü)
    actions/       Server Actions (auth, panel, form işlemleri) — Zod ile doğrulanır
    api/me         Navbar için oturum bilgisi (statik sayfaları dinamikleştirmemek için)
  components/
    ui/            Button, Card, Input/Select/Field, StatusBadge, Tabs, RangeField, AnimatedNumber
    site/          Navbar (mega menü + mobil drawer), Footer, PageHero, Picture, Reveal, CtaBand
    home/          Hero, bento görselleri, hızlı hesap
    tools/         Hesaplayıcı, rota, operatör, karbon, gelir, rezervasyon, asistan, fiyatlandırma, form
    map/           Leaflet haritası (dinamik, SSR kapalı) + filtre gezgini
    panel/         Panel kabuğu, auth formları, araç/profil formları
    charts/        Ortak tooltip + erişilebilir tablo görünümü
  lib/
    calc/          Saf hesap motorları: charging, route, carbon, revenue
    data/          Şehirler, araç segment profilleri, ÖRNEK istasyon/operatör verileri
    adapters/      OperatorAdapter arayüzü + demo adaptör (OCPI'ye hazır)
    assistant/     Kural tabanlı asistan motoru
    server/        db (dosya deposu), auth (scrypt + oturum), seed (demo hesaplar)
    geo.ts         Türkiye sınırı (Natural Earth/world-atlas) → SVG path & GeoJSON
design/renders/    Özgün görsel sahnesi (SVG) — scripts/render-images.mjs ile AVIF/WebP/JPG üretilir
tests/unit         Vitest hesap doğruluk testleri
tests/e2e          Playwright uçtan uca test (taşma, bağlantı, görsel, akışlar, başlıklar)
```

## Kararlar
- **Next.js App Router + statik üretim:** Herkese açık 20+ sayfa statik üretilir; oturum bilgisi `/api/me` ile istemcide alınır, böylece CDN önbelleği bozulmaz.
- **Hesap motorları saf fonksiyon:** UI, asistan ve testler aynı kodu kullanır; "önceki hesaplayıcı bozulmasın" kabul kriteri birim testleriyle güvenceye alınır.
- **Harita:** Leaflet (react-leaflet) — CARTO koyu altlık + yerel Türkiye sınırı GeoJSON. Altlık yüklenemese bile sınır ve işaretçiler görünür.
- **Grafik renkleri:** dataviz doğrulayıcısından geçen 4 renkli kategorik palet (koyu yüzeyde CVD ΔE ≥ 12, kontrast ≥ 3:1). Her grafikte tooltip ve tablo görünümü vardır.
- **Görseller:** Ağ kısıtı nedeniyle stok fotoğraf indirilemedi; tüm görseller bu depoda üretilen **özgün** render'lardır (marka/logo kopyası yok). Hero için yatay ve dikey (mobil) ayrı kompozisyon vardır. Lisanslı fotoğraflarla değiştirmek için `public/images` içine aynı adlarla dosya koymak yeterlidir.
- **Veri deposu:** Geliştirme/demo için atomik yazan JSON dosya deposu. `read`/`write` arayüzü korunarak PostgreSQL'e (Prisma/Drizzle) taşınması önerilir; serverless ortamlarda dosya sistemi kalıcı değildir.
- **Asistan:** Ücretli LLM API'si onaysız bağlanmadı. `answer()` arayüzü korunarak sunucu tarafı bir LLM çağrısıyla (araç çağrısı olarak bu hesap motorlarını kullanan) genişletilebilir.
