import type { Metadata } from 'next';
import { PageHero } from '@/components/site/page-hero';
import { CarbonCalculator } from '@/components/tools/carbon-calculator';
import { Notice } from '@/components/ui/status-badge';

export const metadata: Metadata = { title: 'Karbon ve Enerji Analitiği', description: 'Elektrikli araç ve filonuzun yıllık CO₂ tasarrufunu, enerji tüketimini ve ağaç eşdeğerini hesaplayın.' };

export default function Page() {
  return (
    <>
      <PageHero
        layout="backdrop"
        eyebrow="Karbon & enerji analitiği"
        status={['live', 'model']}
        image={{ name: 'smart-city-grid', alt: 'Enerji hatlarıyla bağlı izometrik akıllı şehir blokları' }}
        title={<>Etkiyi <span className="text-electric-gradient">ölçün</span>, raporlayın.</>}
        description="Sürüş profiliniz, şebeke emisyon faktörü ve yenilenebilir şarj payına göre yıllık emisyonunuzu hesaplayın. Filolar için araç sayısıyla ölçekleyin."
      />
      <section className="shell">
        <CarbonCalculator />
        <Notice status="model" className="mt-8">
          Hesap yalnızca kullanım (egzoz + şebeke) emisyonlarını kapsar; üretim ve batarya yaşam döngüsü emisyonları dahil değildir. Katsayılar yaklaşık değerlerdir ve kurumsal raporlama öncesi güncel resmi kaynaklarla doğrulanmalıdır.
        </Notice>
      </section>
    </>
  );
}
