import type { Metadata } from 'next';
import { PageHero } from '@/components/site/page-hero';
import { RoutePlanner } from '@/components/tools/route-planner';
import { RouteLine } from '@/components/home/visuals';
import { Notice } from '@/components/ui/status-badge';
import { mapGeometry } from '@/lib/geo';

export const metadata: Metadata = {
  title: 'AI Rota Planlayıcı ve Enerji Optimizasyonu',
  description: 'Şehirler arası elektrikli araç yolculuğunuzu planlayın: şarj durakları, toplam süre, maliyet ve varış şarjı. Hız ve sıcaklık etkisi dahil.',
};

export default function Page() {
  const geo = mapGeometry(1000);
  return (
    <>
      <PageHero
        artOnMobile={false}
        layout="center"
        eyebrow="AI rota & enerji"
        status={['live', 'model']}
        title={<>Yolculuğu değil, <span className="text-electric-gradient">enerjiyi</span> planlayın.</>}
        description="Araç profiliniz, hız, dış sıcaklık ve tarifeye göre tüketimi modelleyip şarj duraklarını optimize eder. Üç optimizasyon modu: en hızlı, dengeli, en ekonomik."
        art={<RouteLine className="mx-auto max-w-xl opacity-80" />}
      />
      <section className="shell">
        <RoutePlanner geo={geo} />
        <Notice status="model" className="mt-8">
          Bu sürüm kural tabanlı bir enerji simülasyonudur: hız (100 km/s üstü her km/s için ≈ %0,8) ve sıcaklık etkisi uygulanır. Trafik, yükseklik ve canlı istasyon doluluğu entegrasyonları yol haritasındadır.
        </Notice>
      </section>
    </>
  );
}
