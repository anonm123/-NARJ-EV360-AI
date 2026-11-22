import type { Metadata } from 'next';
import { Target, Eye, HeartHandshake, Cpu } from 'lucide-react';
import { PageHero } from '@/components/site/page-hero';
import { SectionHeading } from '@/components/site/section-heading';
import { Reveal } from '@/components/site/reveal';
import { Card } from '@/components/ui/card';
import { StatusBadge, type Status } from '@/components/ui/status-badge';
import { CtaBand } from '@/components/site/cta-band';

export const metadata: Metadata = { title: 'Hakkımızda ve Teknoloji Yol Haritası', description: 'NAR-J EV360-AI misyonu, değerleri, teknoloji yığını ve ürün yol haritası.' };

const ROADMAP: { phase: string; when: string; status: Status; items: string[] }[] = [
  { phase: 'Faz 0 · Temel', when: '2026', status: 'live', items: ['Web platformu ve tasarım sistemi', 'Şarj, rota, karbon hesaplama motorları', 'Hesap sistemi ve kişisel panel'] },
  { phase: 'Faz 1 · Pilot', when: '2027 ilk yarı', status: 'planned', items: ['İlk OCPI operatör entegrasyonu', 'Mobil uygulama beta', 'Pilot filo programı'] },
  { phase: 'Faz 2 · Ödeme', when: '2027 ikinci yarı', status: 'planned', items: ['Lisanslı ödeme kuruluşuyla tek cüzdan', 'NAR-J Pass RFID', 'Gerçek rezervasyon'] },
  { phase: 'Faz 3 · Zekâ', when: '2028', status: 'planned', items: ['Trafik ve yükseklik verili rota', 'Talep tahmini ve dinamik fiyat önerileri', 'Depo şarj optimizasyonu'] },
];

export default function Page() {
  return (
    <>
      <PageHero
        layout="backdrop"
        eyebrow="Hakkımızda"
        image={{ name: 'battery-pack', alt: 'Şarj olan batarya hücreleri' }}
        title={<>Yolun akıllı gücünü <span className="text-electric-gradient">inşa ediyoruz</span>.</>}
        description="NAR-J EV360-AI, Türkiye’de elektrikli mobiliteye geçişi hızlandırmak için şarj, rota, enerji ve ödeme katmanlarını birleştiren bir yazılım platformu olarak geliştiriliyor."
      />
      <section className="shell grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { i: Target, t: 'Misyon', d: 'Elektrikli yolculuğu öngörülebilir, ekonomik ve stressiz kılmak.' },
          { i: Eye, t: 'Vizyon', d: 'Bölgenin enerji-mobilite işletim sistemi olmak.' },
          { i: HeartHandshake, t: 'Değer', d: 'Şeffaflık: bilmediğimizi uydurmayız, demo olanı demo diye gösteririz.' },
          { i: Cpu, t: 'Teknoloji', d: 'Next.js, TypeScript, standart protokoller (OCPI/OCPP), test edilmiş hesap motorları.' },
        ].map((x, i) => (
          <Reveal key={x.t} delay={i * 0.06}>
            <Card className="h-full p-6">
              <x.i className="size-6 text-neon" aria-hidden />
              <h2 className="mt-4 font-display text-lg font-semibold">{x.t}</h2>
              <p className="mt-2 text-sm text-muted">{x.d}</p>
            </Card>
          </Reveal>
        ))}
      </section>
      <section className="shell mt-24">
        <SectionHeading eyebrow="Yol haritası" title="Teknoloji yol haritası" description="Tarihler hedeftir ve finansman, ortaklık ve regülasyon süreçlerine bağlıdır." />
        <ol className="relative mt-12 space-y-6 border-l border-line-strong pl-6 sm:pl-10">
          {ROADMAP.map((r, i) => (
            <Reveal key={r.phase} delay={i * 0.06}>
              <li className="relative list-none">
                <span aria-hidden className={`absolute -left-[31px] top-6 size-3.5 rounded-full border-2 border-bg sm:-left-[47px] ${r.status === 'live' ? 'bg-neon shadow-[0_0_16px_#00E5D4]' : 'bg-subtle'}`} />
                <Card variant={r.status === 'live' ? 'feature' : 'solid'} className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-semibold">{r.phase}</h3>
                    <div className="flex items-center gap-2"><span className="text-sm text-muted">{r.when}</span><StatusBadge status={r.status} label={r.status === 'live' ? 'Tamamlandı' : undefined} /></div>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-fg/90 sm:grid-cols-3">
                    {r.items.map((it) => <li key={it} className="rounded-xl border border-line bg-bg-2/50 px-3 py-2.5">{it}</li>)}
                  </ul>
                </Card>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>
      <CtaBand />
    </>
  );
}
