import type { Metadata } from 'next';
import { PageHero } from '@/components/site/page-hero';
import { ReservationFlow } from '@/components/tools/reservation-flow';

export const metadata: Metadata = { title: 'Şarj Rezervasyonu', description: 'Şarj noktası, zaman dilimi ve süre seçerek rezervasyon yapın (demo ödeme akışı).' };

export default async function Page({ searchParams }: { searchParams: Promise<{ istasyon?: string }> }) {
  const { istasyon } = await searchParams;
  return (
    <>
      <PageHero
        artOnMobile={false}
        layout="center"
        eyebrow="Rezervasyon"
        status={['demo']}
        title={<>Vardığınızda <span className="text-electric-gradient">soket sizi beklesin</span>.</>}
        description="Dört adımda şarj noktası ayırma deneyimi. Bu akış demo modundadır: gerçek ödeme alınmaz ve istasyonda yer ayrılmaz."
      />
      <section className="shell">
        <ReservationFlow initialStation={istasyon} />
      </section>
    </>
  );
}
