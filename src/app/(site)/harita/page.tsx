import type { Metadata } from 'next';
import { MapExplorer } from '@/components/map/map-explorer';
import { PageHero } from '@/components/site/page-hero';
import { Notice } from '@/components/ui/status-badge';
import { turkeyGeoJson } from '@/lib/geo';
import { SAMPLE_STATIONS } from '@/lib/data/stations';
import { CITIES } from '@/lib/data/cities';

export const metadata: Metadata = {
  title: 'Türkiye Şarj İstasyonları Haritası',
  description: 'Soket tipi, güç, operatör ve erişilebilirliğe göre filtrelenebilen etkileşimli elektrikli araç şarj haritası (örnek veri).',
};

export default function Page() {
  return (
    <>
      <PageHero
        artOnMobile={false}
        eyebrow="Şarj haritası"
        status={['sample']}
        title={<>Türkiye’nin şarj ağı, <span className="text-electric-gradient">tek haritada</span>.</>}
        description="Güç, soket tipi, operatör ve çalışma saatine göre filtreleyin; noktaya dokunun, rezervasyon akışına geçin. Operatör API’leri bağlandığında aynı arayüz gerçek veriyle çalışacak."
        image={{ name: 'charging-station', alt: 'Gece ışıklandırılmış iki modern hızlı şarj ünitesi' }}
      />
      <section className="shell">
        <div className="mb-5 grid grid-cols-3 gap-3 sm:max-w-lg">
          {[
            [SAMPLE_STATIONS.length, 'örnek nokta'],
            [CITIES.length, 'il'],
            [SAMPLE_STATIONS.filter((s) => s.maxKw >= 150).length, 'HPC (150kW+)'],
          ].map(([v, l]) => (
            <div key={String(l)} className="rounded-2xl border border-line bg-surface/60 p-3">
              <p className="tabular font-display text-xl font-semibold">{v}</p>
              <p className="text-xs text-muted">{l}</p>
            </div>
          ))}
        </div>
        <MapExplorer outline={turkeyGeoJson()} />
        <Notice status="sample" className="mt-6">
          Haritadaki noktalar il merkezleri çevresinde üretilmiş temsili konumlardır ve gerçek istasyonları göstermez. Doluluk bilgisi simülasyondur. Sınır verisi: Natural Earth (kamu malı); altlık harita: © OpenStreetMap katkıcıları, © CARTO.
        </Notice>
      </section>
    </>
  );
}
