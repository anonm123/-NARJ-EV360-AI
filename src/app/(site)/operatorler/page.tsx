import type { Metadata } from 'next';
import { PageHero } from '@/components/site/page-hero';
import { OperatorCompare } from '@/components/tools/operator-compare';
import { CtaBand } from '@/components/site/cta-band';
import { SAMPLE_OPERATORS } from '@/lib/data/operators';

export const metadata: Metadata = { title: 'Şarj Operatörü Karşılaştırması', description: 'Şarj operatörlerinin tarifelerini, hizmetlerini ve oturum maliyetini karşılaştırın (anonim örnek profiller).' };

export default function Page() {
  return (
    <>
      <PageHero
        artOnMobile={false}
        layout="center"
        eyebrow="Operatör karşılaştırma"
        status={['sample']}
        title={<>Aynı enerji, <span className="text-electric-gradient">farklı fiyat</span>.</>}
        description="Oturum ücreti, birim fiyat ve bekleme ücretini birlikte hesaplayarak gerçek oturum maliyetini karşılaştırın. Fiyatları kendi bildiğiniz tarifelerle düzenleyebilirsiniz."
        art={
          <div className="mx-auto flex max-w-xl items-end justify-center gap-3" aria-hidden>
            {SAMPLE_OPERATORS.map((o, i) => (
              <div key={o.id} className="flex w-14 flex-col items-center gap-2 sm:w-20">
                <div className="w-full rounded-t-xl border border-line" style={{ height: `${60 + o.dcPrice * 6}px`, background: `linear-gradient(180deg, ${o.color}55, transparent)` }} />
                <span className="text-[11px] text-subtle">{String.fromCharCode(65 + i)}</span>
              </div>
            ))}
          </div>
        }
      />
      <section className="shell">
        <OperatorCompare />
      </section>
      <CtaBand title="Operatör musunuz?" text="NAR-J’ye OCPI uyumlu adaptörle bağlanın; tarifeleriniz ve istasyonlarınız sürücülere doğru biçimde ulaşsın." />
    </>
  );
}
