import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Layers, Repeat, Building2, PlugZap } from 'lucide-react';
import { PageHero } from '@/components/site/page-hero';
import { RevenueModel } from '@/components/tools/revenue-model';
import { SectionHeading } from '@/components/site/section-heading';
import { Reveal } from '@/components/site/reveal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Yatırımcı İlişkileri', description: 'NAR-J EV360-AI iş modeli, gelir kalemleri ve etkileşimli gelir senaryosu modeli.' };

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Yatırımcı ilişkileri"
        status={['model']}
        image={{ name: 'smart-city-grid', alt: 'Akıllı şehir enerji ağı render’ı' }}
        title={<>Elektrikli mobilitenin <span className="text-electric-gradient">yazılım katmanı</span>.</>}
        description="NAR-J; sürücü, filo ve operatör arasında veri ve ödeme akışını birleştiren çok taraflı bir platform olarak tasarlanıyor. Gelir dört tamamlayıcı kalemden oluşur."
        actions={
          <Button asChild>
            <Link href="/iletisim">Yatırımcı sunumu talep et <ArrowRight aria-hidden /></Link>
          </Button>
        }
      />
      <section className="shell">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Repeat, t: 'Sürücü abonelikleri', d: 'Plus planı ile tekrar eden gelir; sınırsız AI rota ve tek ödeme.' },
            { i: Building2, t: 'Filo SaaS', d: 'Araç başına aylık lisans; raporlama, planlama, API.' },
            { i: PlugZap, t: 'İşlem komisyonu', d: 'Platform üzerinden ödenen şarj tutarından pay (tek ödeme aktifleşince).' },
            { i: Layers, t: 'Operatör API', d: 'Görünürlük, rezervasyon ve veri hizmetleri için yıllık ücret.' },
          ].map((x, i) => (
            <Reveal key={x.t} delay={i * 0.06}>
              <Card className="h-full p-6">
                <x.i className="size-6 text-neon" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-semibold">{x.t}</h3>
                <p className="mt-2 text-sm text-muted">{x.d}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="shell mt-20">
        <SectionHeading eyebrow="Senaryo modeli" title="Varsayımları değiştirin, modeli görün." description="Muhafazakâr, baz ve iddialı senaryolar başlangıç noktasıdır. Her parametre değiştirilebilir; sonuçlar anında güncellenir." />
        <div className="mt-10">
          <RevenueModel />
        </div>
      </section>
      <section className="shell mt-20">
        <SectionHeading eyebrow="Fonun kullanımı (önerilen)" title="Ürün, entegrasyon, büyüme." />
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ['%45', 'Ürün & mühendislik', 'Mobil uygulama, OCPI adaptörleri, AI rota motoru'],
            ['%30', 'İş geliştirme', 'Operatör anlaşmaları, pilot filo programı'],
            ['%25', 'Pazarlama & operasyon', 'Sürücü edinimi, destek, uyum'],
          ].map(([p, t, d]) => (
            <Card key={t} variant="outline" className="p-6">
              <p className="tabular font-display text-4xl font-semibold text-electric-gradient">{p}</p>
              <p className="mt-2 font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-xs text-subtle">Oranlar planlama amaçlı öneridir. Bu sayfa yatırım teklifi veya tavsiyesi değildir.</p>
      </section>
    </>
  );
}
