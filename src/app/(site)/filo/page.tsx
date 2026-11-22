import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BatteryCharging, Route, Users, FileBarChart, Warehouse, Gauge } from 'lucide-react';
import { PageHero } from '@/components/site/page-hero';
import { SectionHeading } from '@/components/site/section-heading';
import { Reveal } from '@/components/site/reveal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';

export const metadata: Metadata = { title: 'Akıllı Filo ve Lojistik Yönetimi', description: 'Elektrikli filolar için şarj planlama, araç takibi, maliyet ve karbon raporlama.' };

const FLEET = [
  { p: '34 NJ 100', d: 'A. Yılmaz', s: 82, st: 'Yolda' },
  { p: '34 NJ 107', d: 'B. Kaya', s: 34, st: 'Şarjda' },
  { p: '34 NJ 114', d: 'C. Demir', s: 67, st: 'Depoda' },
  { p: '34 NJ 121', d: 'D. Şahin', s: 18, st: 'Yolda' },
];

export default function Page() {
  return (
    <>
      <PageHero
        layout="backdrop"
        eyebrow="Filo & lojistik"
        status={['demo']}
        image={{ name: 'fleet-highway', alt: 'Gece otoyolunda ışık izleri bırakan elektrikli filo' }}
        title={<>Her aracın enerjisi, <span className="text-electric-gradient">tek komuta merkezinde</span>.</>}
        description="Araç bazlı şarj seviyesi, durum ve günlük kilometre; enerji kısıtlı lojistik planlama ve maliyet raporları. Demo filo hesabıyla paneli hemen deneyin."
        actions={
          <>
            <Button asChild size="lg"><Link href="/giris?demo=filo">Demo filo paneli <ArrowRight aria-hidden /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/iletisim">Kurumsal görüşme</Link></Button>
          </>
        }
      />
      <section className="shell">
        <Reveal>
          <Card variant="feature" className="overflow-hidden p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-subtle">Panel önizleme</p>
                <h2 className="mt-1 font-display text-xl font-semibold">Örnek Lojistik A.Ş.</h2>
              </div>
              <StatusBadge status="sample" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['8', 'Aktif araç'],
                ['%54', 'Ort. şarj'],
                ['688 km', 'Bugün'],
                ['₺1.940', 'Bugünkü şarj'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-line bg-bg-2/60 p-4">
                  <p className="tabular font-display text-2xl font-semibold">{v}</p>
                  <p className="text-xs text-muted">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[520px] text-left text-sm">
                <caption className="sr-only">Örnek filo araç listesi</caption>
                <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
                  <tr><th scope="col" className="px-4 py-3">Plaka</th><th scope="col" className="px-4 py-3">Sürücü</th><th scope="col" className="px-4 py-3">Şarj</th><th scope="col" className="px-4 py-3">Durum</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {FLEET.map((f) => (
                    <tr key={f.p}>
                      <td className="tabular px-4 py-3 font-semibold">{f.p}</td>
                      <td className="px-4 py-3 text-muted">{f.d}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-electric to-neon" style={{ width: `${f.s}%` }} /></div>
                          <span className="tabular text-xs">%{f.s}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{f.st}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>
      </section>
      <section className="shell mt-24">
        <SectionHeading eyebrow="Yetenekler" title="Filo enerjisinin tüm katmanları" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { i: Gauge, t: 'Araç SoC takibi', d: 'Araç bazlı şarj seviyesi ve durum (telematik entegrasyonu planlı).', s: 'demo' as const },
            { i: Route, t: 'Enerji kısıtlı rota', d: 'Teslimat rotalarında şarj duraklarını otomatik planlama.', s: 'beta' as const },
            { i: Warehouse, t: 'Depo şarj planlama', d: 'Gece tarifesine göre yük dengeleme ve kuyruk.', s: 'planned' as const },
            { i: Users, t: 'Roller & yetkiler', d: 'Yönetici, operasyon, sürücü rolleri.', s: 'beta' as const },
            { i: FileBarChart, t: 'Maliyet raporları', d: 'Araç, sürücü ve şube bazlı enerji maliyeti.', s: 'demo' as const },
            { i: BatteryCharging, t: 'Batarya sağlığı', d: 'Şarj alışkanlıklarına göre degradasyon uyarıları.', s: 'planned' as const },
          ].map((x, i) => (
            <Reveal key={x.t} delay={(i % 3) * 0.06}>
              <Card className="h-full p-6">
                <div className="flex items-start justify-between">
                  <x.i className="size-6 text-neon" aria-hidden />
                  <StatusBadge status={x.s} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{x.t}</h3>
                <p className="mt-2 text-sm text-muted">{x.d}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
