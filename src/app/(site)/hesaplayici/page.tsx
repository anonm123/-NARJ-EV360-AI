import type { Metadata } from 'next';
import { PageHero } from '@/components/site/page-hero';
import { ChargeCalculator } from '@/components/tools/charge-calculator';
import { CtaBand } from '@/components/site/cta-band';
import { Gauge } from '@/components/home/visuals';
import { Notice } from '@/components/ui/status-badge';

export const metadata: Metadata = {
  title: 'Şarj Maliyet ve Süre Hesaplayıcı',
  description: 'Araç profili, şarj seviyesi ve istasyon gücüne göre şarj maliyeti, süresi ve eklenen menzili hesaplayın. DC şarj eğrisi dahil.',
};

export default function Page() {
  return (
    <>
      <PageHero
        artOnMobile={false}
        eyebrow="Maliyet & süre"
        status={['live']}
        title={<>Her kilovatsaatin <span className="text-electric-gradient">hesabı</span> net.</>}
        description="Şarj eğrisini, şarj kayıplarını ve istasyon gücünü hesaba katan hesaplayıcı ile maliyeti, süreyi ve eklenen menzili anında görün. Fosil yakıtlı araçla 100 km başına karşılaştırın."
        art={
          <div className="glass relative mx-auto max-w-md rounded-[32px] p-8">
            <Gauge value={80} className="mx-auto max-w-[280px]" />
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-muted">
              <div><p className="font-display text-lg font-semibold text-fg">%15</p>başlangıç</div>
              <div><p className="font-display text-lg font-semibold text-fg">120 kW</p>DC</div>
              <div><p className="font-display text-lg font-semibold text-fg">%80</p>hedef</div>
            </div>
          </div>
        }
      />
      <section className="shell">
        <ChargeCalculator />
        <Notice status="model" className="mt-8">
          Süre hesabı, segment ortalamasını temsil eden genel bir DC şarj eğrisi kullanır (%50 sonrası kademeli, %80 sonrası belirgin yavaşlama). Gerçek süre; batarya sıcaklığı, araç yazılımı ve istasyon yüküne göre değişebilir.
        </Notice>
      </section>
      <CtaBand title="Hesapladınız, şimdi yola çıkın." text="Aynı motoru kullanan AI rota planlayıcı ile şarj duraklarınızı önceden belirleyin." />
    </>
  );
}
