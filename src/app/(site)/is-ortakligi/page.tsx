import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Cable, Database, Radio, ShieldCheck, Store, Building } from 'lucide-react';
import { PageHero } from '@/components/site/page-hero';
import { SectionHeading } from '@/components/site/section-heading';
import { Reveal } from '@/components/site/reveal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ADAPTERS } from '@/lib/adapters';

export const metadata: Metadata = { title: 'İş Ortaklığı ve Operatör Çözümleri', description: 'Şarj operatörleri, lokasyon sahipleri ve filolar için NAR-J entegrasyon modelleri ve API adaptörleri.' };

const CODE = `// src/lib/adapters/types.ts
export interface OperatorAdapter {
  id: string;
  protocol: 'OCPI-2.2.1' | 'REST' | 'MOCK';
  listLocations(): Promise<Location[]>;
  getAvailability(evseId: string): Promise<EvseStatus>;
  reserve(req: ReservationRequest): Promise<ReservationResult>;
  getTariffs(): Promise<Tariff[]>;
}`;

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="İş ortaklığı & API"
        status={['planned']}
        image={{ name: 'charging-station', alt: 'İki hızlı şarj ünitesi' }}
        title={<>İstasyonlarınızı <span className="text-electric-gradient">doğru sürücüyle</span> buluşturun.</>}
        description="Operatörler, lokasyon sahipleri ve filolar için standartlara dayalı entegrasyon. NAR-J şu an aktif bir operatör ortaklığı bulunduğunu iddia etmez; aşağıdaki modeller teklif niteliğindedir."
        actions={<Button asChild><Link href="/iletisim">Ortaklık görüşmesi <ArrowRight aria-hidden /></Link></Button>}
      />
      <section className="shell grid gap-4 md:grid-cols-3">
        {[
          { i: Radio, t: 'Şarj operatörleri', d: 'OCPI ile lokasyon, tarife ve doluluk paylaşımı; rezervasyon ve roaming.' },
          { i: Store, t: 'Lokasyon sahipleri', d: 'AVM, otel ve otoparklar için görünürlük ve kampanya araçları.' },
          { i: Building, t: 'Kurumsal filolar', d: 'Filo SaaS, API erişimi ve özel tarife anlaşmaları.' },
        ].map((x, i) => (
          <Reveal key={x.t} delay={i * 0.06}>
            <Card variant="feature" className="h-full p-6">
              <x.i className="size-6 text-neon" aria-hidden />
              <h3 className="mt-4 font-display text-lg font-semibold">{x.t}</h3>
              <p className="mt-2 text-sm text-muted">{x.d}</p>
            </Card>
          </Reveal>
        ))}
      </section>
      <section className="shell mt-24 grid gap-10 lg:grid-cols-2 lg:items-start">
        <SectionHeading eyebrow="Adaptör mimarisi" title="Tek arayüz, çok operatör" description="Her operatör bağlantısı aynı TypeScript arayüzünü uygular. Arayüz; harita, rezervasyon ve fiyat karşılaştırma modüllerini operatörden bağımsız tutar.">
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { i: Cable, t: 'OCPI 2.2.1 Locations, Tariffs, Sessions, Tokens modülleri' },
              { i: Database, t: 'Normalize edilmiş istasyon şeması ve önbellek katmanı' },
              { i: ShieldCheck, t: 'İmzalı token ile kimlik doğrulama, istek sınırlama, denetim kaydı' },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-3 text-fg/90"><x.i className="size-4 shrink-0 text-neon" aria-hidden />{x.t}</li>
            ))}
          </ul>
        </SectionHeading>
        <Reveal className="min-w-0">
          <pre className="overflow-x-auto rounded-3xl border border-line bg-[#060c16] p-5 text-[13px] leading-relaxed text-muted"><code>{CODE}</code></pre>
          <div className="mt-4 overflow-hidden rounded-3xl border border-line">
            {ADAPTERS.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 last:border-0">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p className="text-xs text-subtle">{a.protocol}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
