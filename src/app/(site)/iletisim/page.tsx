import type { Metadata } from 'next';
import { Mail, Building2, Rocket } from 'lucide-react';
import { LeadForm } from '@/components/tools/lead-form';
import { Eyebrow } from '@/components/site/section-heading';
import { Card } from '@/components/ui/card';
import { Picture } from '@/components/site/picture';

export const metadata: Metadata = { title: 'Erken Erişim ve İletişim', description: 'NAR-J EV360-AI erken erişim listesine katılın veya ekibimizle iletişime geçin.' };

export default function Page() {
  return (
    <section className="relative isolate overflow-hidden pb-10 pt-28 sm:pt-36">
      <Picture name="hero-ev-night" alt="" className="absolute inset-x-0 top-0 -z-20 h-[520px] w-full object-cover opacity-40" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[540px] bg-[linear-gradient(180deg,rgba(5,10,18,0.4),#050A12)]" />
      <div className="shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>Erken erişim</Eyebrow>
          <h1 className="mt-5 text-[clamp(2.1rem,1.4rem+3.2vw,3.8rem)] font-semibold leading-[1.05]">Yolculuğa <span className="text-electric-gradient">birlikte</span> başlayalım.</h1>
          <p className="mt-5 text-lg text-muted">Sürücü, filo yöneticisi, operatör veya yatırımcı olarak listeye katılın. Bilgileriniz yalnızca bu talep için kullanılır.</p>
          <div className="mt-10 space-y-4">
            {[
              { i: Rocket, t: 'Pilot programı', d: 'Erken erişim üyeleri beta sürümüne öncelikli davet alır.' },
              { i: Building2, t: 'Kurumsal demo', d: 'Filo ve operatör ekipleri için canlı ürün turu.' },
              { i: Mail, t: 'Yanıt süresi', d: 'Talepler e-posta ile yanıtlanır; telefon numarası istemiyoruz.' },
            ].map((x) => (
              <div key={x.t} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-neon"><x.i className="size-5" aria-hidden /></span>
                <div>
                  <p className="font-semibold">{x.t}</p>
                  <p className="text-sm text-muted">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Card variant="glass" className="p-6 sm:p-8">
          <LeadForm />
        </Card>
      </div>
    </section>
  );
}
