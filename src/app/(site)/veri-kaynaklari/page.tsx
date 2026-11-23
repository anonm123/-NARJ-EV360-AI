import type { Metadata } from 'next';
import { ExternalLink } from 'lucide-react';
import { PageHero } from '@/components/site/page-hero';
import { StatusBadge, type Status } from '@/components/ui/status-badge';

export const metadata: Metadata = { title: 'Veri Kaynakları ve Lisanslar', description: 'NAR-J EV360-AI’nin kullandığı açık veri kaynakları, lisansları, atıf ve kullanım koşulları.' };

const SOURCES: { name: string; use: string; status: Status; statusLabel: string; license: string; attribution: string; terms: string[]; commercial: string; url: string }[] = [
  {
    name: 'EPDK — Şarj İstasyonları REST Web Servisi',
    use: 'Resmî şarj istasyonları listesi: istasyon no/adı, şarj ağı işletmecisi ve lisans no, marka, hizmet şekli, soketler, adres, koordinat',
    status: 'beta', statusLabel: 'Etkin (birincil kaynak)',
    license: 'Kamu kurumunun yayımladığı resmî web servis. Yazılı bir açık veri lisansı (ör. CC BY) yayımlanmamıştır.',
    attribution: 'Her kayıtta "EPDK Şarj İstasyonları Listesi · Lisans <no>" ve EPDK liste sayfası bağlantısı gösterilir.',
    terms: [
      'Uç nokta: apigateway.epdk.gov.tr/sarjIstasyonlari (GET). EPDK “Web Servisler” sayfasında ve kullanım kılavuzunda yayımlanmıştır.',
      'Kılavuza göre parametresiz (tüm liste) sorgu saatte en fazla 1 kez yapılabilir: liste tek istekle alınır, 6 saat bellekte tutulur, bölge filtresi sunucuda yerel uygulanır; başarısız denemeden sonra 60 dk beklenir.',
      'Liste lisans kaydıdır; anlık çalışma durumu, doluluk ve fiyat içermez (bunlar “bilinmiyor” gösterilir).',
      'Şarj@TR mobil uygulamasından veya lisans.epdk.gov.tr sorgu ekranından veri toplanmaz (scraping yok).',
    ],
    commercial: 'Ücretsiz ve kamuya açık erişim, ticari kullanım izni anlamına gelmez. Ticari yayından önce EPDK’dan yazılı teyit alınması önerilir; gerekirse NARJ_DISABLE_EPDK=1 ile kapatılabilir.',
    url: 'https://www.epdk.gov.tr/Detay/Icerik/3-0-226/web-servisler',
  },
  {
    name: 'Open Charge Map (API v3)',
    use: 'Şarj istasyonu konumu, soket tipi, güç, operatör, durum',
    status: 'planned', statusLabel: 'Anahtar bekleniyor',
    license: 'Kayıt başına veri sağlayıcının lisansı (OCM katkıları: CC BY 4.0). Yalnızca açık veri lisanslı kayıtlar kullanılır (opendata=true + sağlayıcı kontrolü).',
    attribution: 'Haritada ve istasyon ayrıntısında "Open Charge Map · <veri sağlayıcı>" ve kayıt bağlantısı gösterilir.',
    terms: ['Ücretsiz API anahtarı gerekir; anahtarsız istekler HTTP 403 ile reddedilir (23.11.2026’da doğrulandı). Anahtar tanımlanana kadar bu kaynak devre dışıdır; site EPDK ve OSM ile çalışır.', 'Sorgular bölgesel (≤1°) ve 1 saat önbellekli; referans veriler 24 saat önbellekli.', 'Sağlayıcı başına en fazla 2 eşzamanlı istek, zaman aşımı ve sınırlı yeniden deneme.'],
    commercial: 'Kayıt lisansına bağlıdır; CC BY 4.0 kayıtlar atıfla ticari kullanılabilir. Her kaydın lisansı ayrıntıda gösterilir.',
    url: 'https://openchargemap.org/site/develop/api',
  },
  {
    name: 'OpenStreetMap — Overpass API',
    use: 'amenity=charging_station etiketli istasyonlar (soket, güç, çalışma saati)',
    status: 'beta', statusLabel: 'Etkin (düşük hacim)',
    license: 'Open Database License (ODbL) 1.0',
    attribution: '"© OpenStreetMap katkıcıları" atfı harita ve ayrıntılarda görünür.',
    terms: ['Overpass herkese açık sunucusu yoğun/toplu kullanım için değildir: sorgular bölgesel, tek eşzamanlı ve 6 saat önbellekli.', 'Üretimde yüksek hacim için kendi Overpass/OSM extract altyapısı önerilir (OVERPASS_URL ile değiştirilebilir).'],
    commercial: 'ODbL: atıf ve türetilmiş veritabanları için paylaşım yükümlülüğü (share-alike) vardır.',
    url: 'https://www.openstreetmap.org/copyright',
  },
  {
    name: 'OSRM (Open Source Routing Machine)',
    use: 'Gerçek karayolu rotası: mesafe, süre, geometri',
    status: 'beta', statusLabel: 'Demo sunucusu',
    license: 'OSRM yazılımı BSD-2; yol verisi OpenStreetMap (ODbL)',
    attribution: 'Rota haritasında "Rota: OSRM" ve OSM atfı gösterilir.',
    terms: ['router.project-osrm.org yalnızca demo amaçlıdır, üretim altyapısı değildir.', 'Üretim için kendi OSRM/Valhalla/GraphHopper kurulumu OSRM_URL ile verilmelidir.', 'Rotalar 6 saat önbellekli; istekler hız sınırlı.'],
    commercial: 'Demo sunucusu ticari üretim için uygun değildir; kendi sunucunuzda yazılım lisansı ticari kullanıma izin verir.',
    url: 'https://project-osrm.org',
  },
  {
    name: 'Harita altlığı: CARTO Dark Matter (OSM verisiyle)',
    use: 'Harita karoları',
    status: 'beta', statusLabel: 'Kullanımda',
    license: 'Harita verisi © OpenStreetMap katkıcıları (ODbL); stil © CARTO',
    attribution: 'Haritanın sağ altında görünür.',
    terms: ['Toplu karo indirme / çevrimdışı ön yükleme yapılmaz.', 'OSM’nin kendi karo sunucuları kullanılmaz (Tile Usage Policy).'],
    commercial: 'CARTO’nun ücretsiz basemap kullanımı koşullara tabidir; ticari ölçekte CARTO lisansı veya kendi karo sunucusu gerekir.',
    url: 'https://carto.com/attributions',
  },
];

export default function Page() {
  return (
    <>
      <PageHero layout="center" eyebrow="Şeffaflık" title={<>Veri kaynakları ve <span className="text-electric-gradient">lisanslar</span></>} description="NAR-J yalnızca yasal, açık ve belgelenmiş kaynakları kullanır. Bilinmeyen bilgiler uydurulmaz; anlık doluluk, canlı fiyat ve rezervasyon için operatörlerle yetkili entegrasyon gerekir." />
      <section className="shell space-y-4">
        {SOURCES.map((s) => (
          <article key={s.name} className="rounded-3xl border border-line bg-surface/60 p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold">{s.name}</h2>
                <p className="mt-1 text-sm text-muted">{s.use}</p>
              </div>
              <StatusBadge status={s.status} label={s.statusLabel} />
            </div>
            <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
              <div><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Lisans</dt><dd className="mt-1">{s.license}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Atıf</dt><dd className="mt-1">{s.attribution}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Ticari kullanım</dt><dd className="mt-1">{s.commercial}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Limit, önbellek ve koşullar</dt><dd className="mt-1"><ul className="list-disc space-y-1 pl-5 text-muted">{s.terms.map((t) => <li key={t}>{t}</li>)}</ul></dd></div>
            </dl>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-neon hover:underline">Resmî sayfa <ExternalLink className="size-3.5" aria-hidden /></a>
          </article>
        ))}
        <p className="text-xs text-subtle">Ücretsiz erişim, ticari kullanım izni anlamına gelmez. Ticari yayına geçmeden önce her sağlayıcının güncel koşulları hukuken gözden geçirilmelidir.</p>
      </section>
    </>
  );
}
