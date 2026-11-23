import type { Metadata } from 'next';
import Link from 'next/link';
import { MapExplorer } from '@/components/map/map-explorer';
import { PageHero } from '@/components/site/page-hero';
import { Notice } from '@/components/ui/status-badge';
import { turkeyGeoJson } from '@/lib/geo';

export const metadata: Metadata = {
  title: 'Türkiye Şarj İstasyonları Haritası',
  description: 'EPDK, Open Charge Map ve OpenStreetMap kaynaklı gerçek elektrikli araç şarj istasyonları; soket, güç, AC/DC ve kaynak filtreleri.',
};

export default function Page() {
  return (
    <>
      <PageHero
        artOnMobile={false}
        eyebrow="Şarj haritası"
        status={['live']}
        title={<>Türkiye’nin şarj ağı, <span className="text-electric-gradient">gerçek verilerle</span>.</>}
        description="İstasyonlar açık veri kaynaklarından (EPDK resmî web servisi, Open Charge Map, OpenStreetMap) canlı olarak alınır, ortak şemada birleştirilir ve her kaydın kaynağı ile lisansı gösterilir. Bilinmeyen bilgiler uydurulmaz."
        image={{ name: 'charging-station', alt: 'Gece ışıklandırılmış iki modern hızlı şarj ünitesi' }}
      />
      <section className="shell">
        <MapExplorer outline={turkeyGeoJson()} />
        <Notice status="beta" className="mt-6">
          Veriler topluluk ve açık veri kaynaklarındandır; eksik veya güncel olmayan kayıtlar olabilir. Anlık doluluk, canlı fiyat ve rezervasyon için operatörlerle yetkili entegrasyon gerekir; bu bilgiler gösterilmez. EPDK Şarj@TR resmî web servisleri entegrasyon için incelenmektedir. Ayrıntılar: <Link href="/veri-kaynaklari" className="text-neon underline-offset-2 hover:underline">Veri kaynakları ve lisanslar</Link>.
        </Notice>
      </section>
    </>
  );
}
