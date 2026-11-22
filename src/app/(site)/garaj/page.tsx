import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BatteryFull, Gauge, Zap, UserRound, ShieldCheck, Route } from 'lucide-react';
import { PageHero } from '@/components/site/page-hero';
import { SectionHeading } from '@/components/site/section-heading';
import { Reveal } from '@/components/site/reveal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/status-badge';
import { VEHICLE_PROFILES, estimatedRangeKm } from '@/lib/data/vehicles';
import { fmt } from '@/lib/utils';

export const metadata: Metadata = { title: 'Araç Garajı ve Kullanıcı Profili', description: 'Segment bazlı EV profilleri; kendi aracınızı garajınıza ekleyip tüm hesaplamalarda kullanın.' };

function Silhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 320 110" className="w-full" aria-hidden>
      <defs>
        <linearGradient id={`sil-${color}`} x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="98" rx="140" ry="6" fill="#000" opacity="0.6" />
      <path d="M20 84 C 18 70, 26 62, 42 58 C 70 40, 110 26, 160 25 C 196 25, 216 34, 236 48 C 262 52, 290 58, 298 70 C 302 78, 300 84, 292 86 Z" fill="#0d1624" stroke="rgba(154,175,197,0.25)" />
      <path d="M42 58 C 70 40, 110 26, 160 25 C 196 25, 216 34, 236 48 C 262 52, 290 58, 298 70" fill="none" stroke={`url(#sil-${color})`} strokeWidth="2" />
      <path d="M90 52 C 115 36, 150 32, 175 33 C 196 34, 208 40, 220 48 L 90 54 Z" fill="#132235" />
      {[78, 244].map((x) => (
        <g key={x}>
          <circle cx={x} cy="86" r="16" fill="#05070a" />
          <circle cx={x} cy="86" r="10" fill="#1a2433" stroke={color} strokeOpacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Araç garajı"
        status={['live']}
        title={<>Aracınızı tanıyan <span className="text-electric-gradient">hesaplamalar</span>.</>}
        description="Batarya, tüketim ve şarj gücü değerleriyle araç profilinizi oluşturun; rota, maliyet ve karbon hesapları otomatik olarak aracınıza göre çalışsın."
        image={{ name: 'hero-ev-night', alt: 'Şarj istasyonunda elektrikli otomobil' }}
        actions={
          <Button asChild>
            <Link href="/panel/garaj" prefetch={false}>Garajımı aç <ArrowRight aria-hidden /></Link>
          </Button>
        }
      />
      <section className="shell">
        <SectionHeading eyebrow="Segment profilleri" title="Hazır şablonlarla başlayın" description="Aşağıdaki profiller segment ortalamalarını temsil eder; belirli bir marka veya modelin resmi değerleri değildir." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VEHICLE_PROFILES.map((v, i) => (
            <Reveal key={v.id} delay={(i % 3) * 0.06}>
              <Card variant="feature" interactive className="h-full overflow-hidden p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-subtle">{v.segment}</p>
                    <h3 className="mt-1 font-display text-xl font-semibold">{v.name}</h3>
                  </div>
                  <span className="size-3 rounded-full" style={{ background: v.accent, boxShadow: `0 0 16px ${v.accent}` }} aria-hidden />
                </div>
                <div className="my-5"><Silhouette color={v.accent} /></div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { i: BatteryFull, l: 'Batarya', v: `${v.batteryKwh} kWh` },
                    { i: Gauge, l: 'Tüketim', v: `${fmt.num(v.consumptionKwhPer100)} kWh` },
                    { i: Zap, l: 'Maks. DC', v: `${v.maxDcKw} kW` },
                    { i: Route, l: 'Tahmini menzil', v: `${fmt.int(estimatedRangeKm(v))} km` },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl border border-line bg-bg-2/50 p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-subtle"><s.i className="size-3.5" aria-hidden />{s.l}</dt>
                      <dd className="tabular mt-1 font-semibold">{s.v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="shell mt-24 grid gap-6 lg:grid-cols-2">
        <Card className="p-7">
          <UserRound className="size-6 text-neon" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-semibold">Kişisel alanınız</h2>
          <p className="mt-2 text-muted">Her kullanıcının kendi paneli vardır: araçlar, kayıtlı rotalar, rezervasyonlar ve profil ayarları yalnızca size görünür.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/kayit">Hesap oluştur</Link></Button>
            <Button asChild variant="secondary"><Link href="/giris">Giriş yap</Link></Button>
          </div>
        </Card>
        <Card variant="outline" className="p-7">
          <ShieldCheck className="size-6 text-neon" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-semibold">Veri minimizasyonu</h2>
          <p className="mt-2 text-muted">Araç için yalnızca hesaplamaya gereken teknik değerleri saklarız. Plaka opsiyoneldir; konum geçmişi tutulmaz.</p>
          <Notice status="beta" className="mt-6">Araç verileri şu an manuel girilir. Araç üreticisi bulut bağlantıları (OEM API) planlıdır.</Notice>
        </Card>
      </section>
    </>
  );
}
