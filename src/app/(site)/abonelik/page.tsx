import type { Metadata } from 'next';
import { Check, Minus } from 'lucide-react';
import { PageHero } from '@/components/site/page-hero';
import { Pricing } from '@/components/tools/pricing';
import { SectionHeading } from '@/components/site/section-heading';
import { Notice } from '@/components/ui/status-badge';

export const metadata: Metadata = { title: 'Abonelik ve Kurumsal SaaS', description: 'NAR-J bireysel sürücü ve kurumsal filo planları.' };

const MATRIX: [string, boolean | string, boolean | string, boolean | string][] = [
  ['Şarj haritası', true, true, true],
  ['Maliyet hesaplayıcı', true, true, true],
  ['AI rota planı', '5 / ay', 'Sınırsız', 'Sınırsız'],
  ['Araç profili', '1', '5', 'Sınırsız'],
  ['Rezervasyon', false, true, true],
  ['Karbon raporu', false, true, 'Kurumsal rapor'],
  ['Filo paneli & roller', false, false, true],
  ['API erişimi', false, false, true],
  ['SSO / SAML', false, false, 'Kurumsal ek'],
];

export default function Page() {
  return (
    <>
      <PageHero layout="center" eyebrow="Abonelik & SaaS" title={<>Yolculuğunuza <span className="text-electric-gradient">uygun plan</span>.</>} description="Bireysel sürücüden yüzlerce araçlık filoya ölçeklenen planlar. Lansman öncesi önerilen fiyatlandırmadır; erken erişim üyelerine özel indirim planlanmaktadır." />
      <section className="shell">
        <Pricing />
      </section>
      <section className="shell mt-24">
        <SectionHeading title="Planları karşılaştırın" />
        <div className="mt-8 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Plan özellik karşılaştırması</caption>
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-5 py-4">Özellik</th>
                <th scope="col" className="px-4 py-4">Sürücü</th>
                <th scope="col" className="px-4 py-4">Plus</th>
                <th scope="col" className="px-4 py-4">Filo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MATRIX.map(([f, ...v]) => (
                <tr key={f}>
                  <th scope="row" className="px-5 py-3.5 font-medium text-fg">{f}</th>
                  {v.map((c, i) => (
                    <td key={i} className="px-4 py-3.5 text-muted">
                      {c === true ? <Check className="size-4 text-ok" aria-label="Dahil" /> : c === false ? <Minus className="size-4 text-subtle" aria-label="Dahil değil" /> : c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Notice status="planned" className="mt-6">Ücretli planlar henüz satışta değildir; bu sayfada ödeme alınmaz. Kurumsal teklif için iletişim formunu kullanın.</Notice>
      </section>
    </>
  );
}
