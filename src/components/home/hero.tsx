'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ChevronDown, Route, Zap, Gauge, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Picture } from '@/components/site/picture';
import { fmt } from '@/lib/utils';

export interface HeroPreview {
  from: string;
  to: string;
  distanceKm: number;
  stops: number;
  totalMinutes: number;
  totalCost: number;
  arrivalSoc: number;
}

export function Hero({ preview }: { preview: HeroPreview }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '12%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.04, reduce ? 1.04 : 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  const ease = [0.22, 1, 0.36, 1] as const;
  // Hero metni yalnızca transform ile girer; opaklık 0'dan başlamaz (LCP dostu).
  const item = (d: number) => ({
    initial: reduce ? false : { y: 28 },
    animate: { y: 0 },
    transition: { duration: 1, delay: d, ease },
  });

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden" aria-label="NAR-J EV360-AI tanıtım">
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0 -z-20 will-change-transform">
        <Picture
          name="hero-ev-night"
          portrait="hero-ev-night-portrait"
          alt="Gece, yağmurla ıslanmış zeminde şarj istasyonuna bağlı aerodinamik elektrikli otomobil"
          priority
          className="size-full object-cover object-[50%_100%] sm:object-center"
        />
      </motion.div>
      {/* Okunabilirlik katmanları */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,10,18,0.85)_0%,rgba(5,10,18,0.55)_45%,rgba(5,10,18,0)_68%,rgba(5,10,18,0.2)_90%,#050A12_100%)] sm:bg-[linear-gradient(90deg,rgba(5,10,18,0.92)_0%,rgba(5,10,18,0.55)_42%,rgba(5,10,18,0)_70%),linear-gradient(180deg,rgba(5,10,18,0.4)_0%,transparent_30%,transparent_70%,#050A12_100%)]" />
      <div aria-hidden className="grid-texture absolute inset-0 -z-10 opacity-40" />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="shell flex flex-1 flex-col justify-start pb-[38svh] pt-24 sm:justify-center sm:pb-24 sm:pt-32">
        <motion.div {...item(0.1)} className="flex flex-wrap items-center gap-2">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-fg">
            <Sparkles className="size-3.5 text-neon" aria-hidden />
            Yapay zekâ destekli e-mobilite platformu
          </span>
          <StatusBadge status="beta" label="Lansman öncesi" className="hidden min-[420px]:inline-flex" />
        </motion.div>

        <motion.h1 {...item(0.22)} className="mt-5 font-display font-semibold sm:mt-6 leading-[0.95] tracking-[-0.035em]">
          <span className="block text-[clamp(2.9rem,1.2rem+8vw,7.6rem)] text-fg">NAR-J</span>
          <span className="text-gradient block text-[clamp(2.3rem,0.9rem+6.6vw,6.4rem)]">EV360-AI</span>
        </motion.h1>

        <motion.p {...item(0.36)} className="mt-5 flex items-center gap-3 font-display text-[clamp(1.15rem,0.9rem+1vw,1.75rem)] font-medium text-fg/90">
          <span aria-hidden className="h-px w-10 bg-gradient-to-r from-electric to-neon" />
          Yolun Akıllı Gücü
        </motion.p>

        <motion.p {...item(0.48)} className="mt-5 max-w-xl text-[clamp(1rem,0.92rem+0.4vw,1.2rem)] leading-relaxed text-muted">
          Şarj noktasını bulun, yolculuğunuzu enerji açısından yapay zekâ ile optimize edin, maliyeti ve süreyi saniyeler içinde bilin. Bireysel sürücüden kurumsal filoya tek platform.
        </motion.p>

        <motion.div {...item(0.6)} className="mt-7 flex flex-col gap-3 min-[420px]:flex-row sm:mt-9">
          <Button asChild size="lg">
            <Link href="#platform">
              Platformu Keşfet <ArrowRight className="transition-transform group-hover/btn:translate-x-1" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/rota">
              <Route aria-hidden /> Rota Planla
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Masaüstü: gerçek hesaplanan rota önizleme kartı */}
      <motion.aside
        initial={reduce ? false : { opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.1, delay: 0.9, ease }}
        className="glass absolute bottom-24 right-[max(24px,calc((100vw-1240px)/2+24px))] hidden w-[340px] rounded-3xl p-5 xl:block"
        aria-label="Örnek rota hesabı"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">AI rota önizleme</p>
          <StatusBadge status="live" label="Hesaplandı" />
        </div>
        <p className="mt-3 font-display text-xl font-semibold text-fg">
          {preview.from} <span className="text-neon">→</span> {preview.to}
        </p>
        <p className="text-xs text-subtle">Kompakt SUV profili · %80 başlangıç · dengeli mod</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: Gauge, v: `${fmt.int(preview.distanceKm)} km`, l: 'mesafe*' },
            { icon: Zap, v: `${preview.stops} durak`, l: 'şarj' },
            { icon: Route, v: fmt.duration(preview.totalMinutes), l: 'toplam' },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-line bg-bg-2/60 px-2 py-3">
              <s.icon className="mx-auto size-4 text-neon" aria-hidden />
              <p className="tabular mt-1.5 text-sm font-semibold text-fg">{s.v}</p>
              <p className="text-[10px] uppercase tracking-wider text-subtle">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted">
            <span>Varış şarjı</span>
            <span className="tabular font-semibold text-fg">%{Math.round(preview.arrivalSoc)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,#00B8FF,#00E5D4)]"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${preview.arrivalSoc}%` }}
              transition={{ duration: 1.4, delay: 1.3, ease }}
            />
          </div>
          <p className="mt-3 text-[11px] leading-snug text-subtle">*Tahmini karayolu mesafesi. Şarj maliyeti ≈ {fmt.try(preview.totalCost)} (örnek tarife).</p>
        </div>
      </motion.aside>

      <a href="#hikaye" className="absolute bottom-6 left-1/2 hidden min-h-11 -translate-x-1/2 flex-col items-center gap-1 text-[11px] uppercase tracking-[0.25em] text-subtle sm:flex" aria-label="Aşağı kaydır">
        Keşfet
        <ChevronDown className="size-4 animate-bounce motion-reduce:animate-none" aria-hidden />
      </a>
    </section>
  );
}
