import type { Metadata } from 'next';
import { Bot, Calculator, Map, Route } from 'lucide-react';
import { AssistantChat } from '@/components/tools/assistant-chat';
import { Eyebrow } from '@/components/site/section-heading';
import { Reveal } from '@/components/site/reveal';
import { StatusBadge } from '@/components/ui/status-badge';

export const metadata: Metadata = { title: 'NAR-J AI Asistan', description: 'Rota, şarj maliyeti, istasyon ve karbon sorularınızı platformun hesaplama motoruyla yanıtlayan asistan.' };

export default function Page() {
  return (
    <section className="relative overflow-hidden pb-10 pt-28 sm:pt-36">
      <div aria-hidden className="absolute left-1/2 top-20 -z-10 h-[600px] w-[min(1000px,140vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,184,255,0.18),transparent)] blur-2xl" />
      <div className="shell grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <Reveal className="lg:sticky lg:top-28">
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>NAR-J AI</Eyebrow>
            <StatusBadge status="beta" />
          </div>
          <h1 className="mt-5 text-[clamp(2.1rem,1.4rem+3.2vw,3.8rem)] font-semibold leading-[1.05]">Sorun, <span className="text-electric-gradient">hesaplasın</span>.</h1>
          <p className="mt-5 text-lg text-muted">Asistan, sorularınızı platformun gerçek rota, şarj ve karbon motorlarıyla yanıtlar. Uydurma canlı veri üretmez; bilmediğini söyler.</p>
          <ul className="mt-8 space-y-3">
            {[
              { i: Route, t: 'Şehirler arası rota ve durak önerisi' },
              { i: Calculator, t: 'Şarj maliyeti ve süre tahmini' },
              { i: Map, t: 'Şehre göre örnek istasyon listesi' },
              { i: Bot, t: 'Büyük dil modeli entegrasyonu · planlı' },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-3 text-fg/90">
                <span className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-neon"><x.i className="size-4" aria-hidden /></span>
                {x.t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="min-w-0">
          <AssistantChat />
        </Reveal>
      </div>
    </section>
  );
}
