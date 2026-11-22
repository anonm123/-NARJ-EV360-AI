import type { Metadata } from 'next';
import { CreditCard, Nfc, Wallet, Receipt, ShieldCheck, Globe2 } from 'lucide-react';
import { PageHero } from '@/components/site/page-hero';
import { SectionHeading } from '@/components/site/section-heading';
import { Reveal } from '@/components/site/reveal';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/status-badge';
import { CtaBand } from '@/components/site/cta-band';

export const metadata: Metadata = { title: 'RFID ve Tek Ödeme Vizyonu', description: 'NAR-J Pass: farklı operatörlerde tek kart, tek cüzdan ve tek fatura vizyonu.' };

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="RFID & tek ödeme"
        status={['planned']}
        image={{ name: 'rfid-pass', alt: 'Şarj ünitesine yaklaştırılan NAR-J Pass RFID kartı' }}
        title={<>Bir kart. <span className="text-electric-gradient">Her istasyon.</span></>}
        description="Bugün her operatör için ayrı uygulama, ayrı kart, ayrı cüzdan gerekiyor. NAR-J Pass; roaming altyapısı üzerinden tek kimlik, tek cüzdan ve tek aylık fatura sunmayı hedefliyor."
      />
      <section className="shell">
        <SectionHeading eyebrow="Nasıl çalışacak" title="Dört adımda kesintisiz şarj" />
        <ol className="relative mt-12 grid gap-4 md:grid-cols-4">
          <div aria-hidden className="hairline absolute left-0 right-0 top-7 hidden md:block" />
          {[
            { i: CreditCard, t: 'Kartı eşleştir', d: 'NAR-J Pass kartınızı veya telefonunuzu hesabınıza bağlayın.' },
            { i: Nfc, t: 'Dokun', d: 'Desteklenen istasyonda kartı okutun; kimlik roaming ağı üzerinden doğrulanır.' },
            { i: Wallet, t: 'Tek cüzdan', d: 'Tüm operatörlerdeki oturumlar tek bakiyeden düşer.' },
            { i: Receipt, t: 'Tek fatura', d: 'Ay sonunda kurumsal uyumlu tek e-fatura.' },
          ].map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <li className="relative list-none">
                <span className="relative z-10 grid size-14 place-items-center rounded-2xl border border-neon/40 bg-bg text-neon shadow-[0_0_30px_-8px_rgba(0,229,212,0.6)]"><s.i className="size-6" aria-hidden /></span>
                <p className="mt-5 font-display text-lg font-semibold"><span className="tabular text-subtle">0{i + 1}</span> {s.t}</p>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>
      <section className="shell mt-24 grid gap-4 md:grid-cols-3">
        {[
          { i: ShieldCheck, t: 'Güvenlik', d: 'Kart verisi PCI-DSS sertifikalı ödeme kuruluşunda tutulur; NAR-J kart numarası saklamaz.' },
          { i: Globe2, t: 'Standartlar', d: 'OCPI 2.2.1 token modülü ve OCPP 1.6/2.0.1 yetkilendirme akışlarıyla uyumlu mimari.' },
          { i: Wallet, t: 'Kurumsal kartlar', d: 'Filo sürücülerine limitli kart tanımlama ve harcama politikaları.' },
        ].map((x) => (
          <Card key={x.t} variant="outline" className="p-6">
            <x.i className="size-6 text-neon" aria-hidden />
            <h3 className="mt-4 font-display text-lg font-semibold">{x.t}</h3>
            <p className="mt-2 text-sm text-muted">{x.d}</p>
          </Card>
        ))}
      </section>
      <section className="shell mt-8">
        <Notice status="planned">NAR-J Pass bir vizyon ve yol haritası öğesidir. Operatörlerle roaming anlaşmaları ve lisanslı ödeme kuruluşu ortaklığı tamamlanmadan kart dağıtımı veya ödeme yapılmaz.</Notice>
      </section>
      <CtaBand title="NAR-J Pass bekleme listesi" text="Kart pilot programına ilk katılanlardan olun." />
    </>
  );
}
