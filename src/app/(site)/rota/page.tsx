import type { Metadata } from 'next';
import { PageHero } from '@/components/site/page-hero';
import { RoutePlanner } from '@/components/tools/route-planner';
import { RouteLine } from '@/components/home/visuals';
import { Notice } from '@/components/ui/status-badge';

export const metadata: Metadata = {
  title: 'AI Rota Planlayıcı ve Enerji Optimizasyonu',
  description: 'Şehirler arası elektrikli araç yolculuğunuzu planlayın: şarj durakları, toplam süre, maliyet ve varış şarjı. Hız ve sıcaklık etkisi dahil.',
};

export default function Page() {
  return (
    <>
      <PageHero
        artOnMobile={false}
        layout="center"
        eyebrow="AI rota & enerji"
        status={['live']}
        title={<>Yolculuğu değil, <span className="text-electric-gradient">enerjiyi</span> planlayın.</>}
        description="Gerçek karayolu rotası (OSRM) üzerinde aracınızın enerji tüketimini hesaplar; menzil yetmediğinde şarj duraklarını açık kaynaklardaki gerçek DC istasyonlarından seçer."
        art={<RouteLine className="mx-auto max-w-xl opacity-80" />}
      />
      <section className="shell">
        <RoutePlanner />
        <Notice status="beta" className="mt-8">
          Mesafe ve süre OSRM açık kaynak routing motorundan gelir (herkese açık demo sunucusu; üretimde kendi sunucusu önerilir). Şarj süreleri genel bir DC şarj eğrisiyle tahminidir. Rakım verisi kullanılmaz; sıcaklık düzeltmesi yalnızca siz girerseniz uygulanır. İstasyon doluluğu ve canlı fiyat bilinmez.
        </Notice>
      </section>
    </>
  );
}
