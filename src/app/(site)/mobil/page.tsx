import type { Metadata } from 'next';
import { PageHero } from '@/components/site/page-hero';
import { PhoneMock } from '@/components/tools/phone-mock';
import { Reveal } from '@/components/site/reveal';
import { SectionHeading } from '@/components/site/section-heading';
import { Notice } from '@/components/ui/status-badge';

export const metadata: Metadata = { title: 'Mobil Uygulama Önizlemesi', description: 'NAR-J mobil uygulamasının ana ekran, harita, şarj oturumu ve rota ekranları.' };

export default function Page() {
  const screens = [
    { s: 'home' as const, t: 'Ana ekran', d: 'Araç şarj durumu, menzil ve kişisel AI önerileri.' },
    { s: 'map' as const, t: 'Harita', d: 'Yakındaki noktalar, filtreler ve tek dokunuşla yol tarifi.' },
    { s: 'charge' as const, t: 'Şarj oturumu', d: 'Anlık güç, enerji ve tutar takibi.' },
    { s: 'route' as const, t: 'Rota', d: 'Duraklı yolculuk planı ve navigasyon geçişi.' },
  ];
  return (
    <>
      <PageHero layout="center" eyebrow="Mobil deneyim" status={['planned']} title={<>Cebinizde <span className="text-electric-gradient">yolun akıllı gücü</span>.</>} description="iOS ve Android uygulaması tasarım aşamasında. Aşağıdaki ekranlar ürün vizyonunu gösteren etkileşimsiz önizlemelerdir." />
      <section className="shell">
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {screens.map((x, i) => (
            <Reveal key={x.s} delay={i * 0.08} className="w-[78vw] max-w-[300px] shrink-0 snap-center lg:w-auto lg:max-w-none">
              <PhoneMock screen={x.s} className={i % 2 ? 'lg:translate-y-10' : ''} />
              <div className="mt-6 text-center lg:mt-14">
                <p className="font-display text-lg font-semibold">{x.t}</p>
                <p className="mt-1 text-sm text-muted">{x.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="shell mt-20">
        <SectionHeading title="Tasarım ilkeleri" description="Tek elle kullanım, 44 px+ dokunma alanları, karanlık ortamda göz yormayan kontrast ve sürüş sırasında dikkat dağıtmayan sesli yönlendirme." />
        <Notice status="planned" className="mt-6">Uygulama mağazalarında henüz yayınlanmamıştır. Beta davetleri erken erişim listesi üzerinden gönderilecektir.</Notice>
      </section>
    </>
  );
}
