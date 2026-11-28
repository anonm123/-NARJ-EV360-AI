import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Cpu, Leaf, ShieldCheck, UserRound, Zap } from 'lucide-react';
import { ToggGarage } from '@/components/garage/togg-garage';
import { Reveal } from '@/components/site/reveal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notice, StatusBadge } from '@/components/ui/status-badge';

export const metadata: Metadata = {
  title: 'Araç Garajı · Togg T10X ve T10F',
  description: 'Togg T10X ve T10F sürümlerinin resmî kaynaklı teknik verileri, renk seçenekleri ve NAR-J hesaplamaları. Varsayılan aracınız tüm hesaplamalarda kullanılır.',
};

export default function Page() {
  return (
    <>
      {/* Marka kimliği */}
      <section className="relative isolate overflow-hidden pb-10 pt-28 sm:pb-14 sm:pt-36">
        <div aria-hidden className="grid-texture absolute inset-0 -z-10" />
        <div aria-hidden className="absolute left-1/2 top-0 -z-10 h-[560px] w-[min(1200px,150vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,229,212,0.18),transparent)] blur-2xl" />
        <div className="shell text-center">
          <Reveal>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-neon"><span aria-hidden className="h-px w-6 bg-gradient-to-r from-transparent to-neon" />Araç garajı</p>
              <StatusBadge status="live" />
            </div>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,1.4rem+4.6vw,5.2rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
              Türkiye&apos;nin <span className="text-electric-gradient">Mobilite Geleceği</span>
            </h1>
            <p className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-display text-[clamp(0.95rem,0.85rem+0.5vw,1.25rem)] font-medium text-fg/85">
              <span className="inline-flex items-center gap-2"><Cpu className="size-4 text-neon" aria-hidden />Yerli Teknoloji</span>
              <span aria-hidden className="text-neon">•</span>
              <span className="inline-flex items-center gap-2"><Zap className="size-4 text-neon" aria-hidden />Akıllı Enerji</span>
              <span aria-hidden className="text-neon">•</span>
              <span className="inline-flex items-center gap-2"><Leaf className="size-4 text-neon" aria-hidden />Sürdürülebilir Ulaşım</span>
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,0.95rem+0.3vw,1.15rem)] leading-relaxed text-muted">
              Togg T10X ve T10F sürümlerini resmî kaynaklı teknik verileriyle inceleyin, renginizi seçin ve aracınızı varsayılan yapın: maliyet, rota, şarj süresi ve karbon hesapları otomatik olarak ona göre çalışsın.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-subtle">
              NAR-J bağımsız bir mobilite platformudur; Togg ile resmî bir ortaklığı veya iş birliği bulunmamaktadır. Togg, T10X ve T10F adları ile renk adları Togg&apos;un ticari markalarıdır ve yalnızca araçları tanımlamak için kullanılır.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="shell">
        <ToggGarage />
      </section>

      <section className="shell mt-20 grid gap-6 lg:grid-cols-2">
        <Card className="p-7">
          <UserRound className="size-6 text-neon" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-semibold">Kişisel garajınız</h2>
          <p className="mt-2 text-muted">Hesabınızla giriş yaparak aracınızı plaka ve kendi değerleriyle kaydedin; araçlar, kayıtlı rotalar ve rezervasyonlar yalnızca size görünür.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/panel/garaj" prefetch={false}>Garajımı aç <ArrowRight aria-hidden /></Link></Button>
            <Button asChild variant="secondary"><Link href="/kayit">Hesap oluştur</Link></Button>
          </div>
        </Card>
        <Card variant="outline" className="p-7">
          <ShieldCheck className="size-6 text-neon" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-semibold">Dürüst veri</h2>
          <p className="mt-2 text-muted">Her değerin yanında kaynağı ve durumu yazar: <strong className="text-fg">Resmî</strong>, <strong className="text-fg">model geneli</strong>, <strong className="text-fg">çelişkili</strong>, <strong className="text-fg">NAR-J varsayımı/tahmini</strong> veya <strong className="text-fg">doğrulanamadı</strong>. Resmî kaynakta bulunmayan değer uydurulmaz.</p>
          <Notice status="beta" className="mt-6">Araç üreticisi bulut bağlantıları (canlı şarj seviyesi, konum) yetkili entegrasyon gerektirir ve şu an yoktur.</Notice>
        </Card>
      </section>
    </>
  );
}
