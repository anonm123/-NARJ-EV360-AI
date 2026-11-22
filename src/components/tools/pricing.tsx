'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, fmt } from '@/lib/utils';

const PLANS = [
  { id: 'free', name: 'Sürücü', price: 0, tag: 'Başlangıç', desc: 'Keşif ve temel hesaplama', features: ['Şarj haritası ve filtreler', 'Maliyet & süre hesaplayıcı', 'Ayda 5 AI rota planı', '1 araç profili'], cta: 'Ücretsiz başla', href: '/kayit' },
  { id: 'plus', name: 'Sürücü Plus', price: 129, tag: 'En popüler', desc: 'Sık yolculuk yapanlar için', features: ['Sınırsız AI rota planı', 'Rezervasyon önceliği', 'NAR-J Pass (tek ödeme) erken erişim', '5 araç profili', 'Karbon raporu'], cta: 'Erken erişime katıl', href: '/iletisim', featured: true },
  { id: 'fleet', name: 'Filo', price: 340, unit: 'araç / ay', tag: 'Kurumsal', desc: 'Lojistik ve kurumsal filolar', features: ['Filo paneli ve rol yönetimi', 'Depo şarj planlama', 'Sürücü bazlı maliyet raporları', 'API erişimi', 'Öncelikli destek'], cta: 'Demo talep et', href: '/iletisim' },
];

export function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-line bg-bg-2 p-1" role="radiogroup" aria-label="Faturalama dönemi">
          {[false, true].map((y) => (
            <button key={String(y)} type="button" role="radio" aria-checked={yearly === y} onClick={() => setYearly(y)} className={cn('min-h-11 rounded-full px-5 text-sm font-semibold transition-colors', yearly === y ? 'bg-[linear-gradient(110deg,rgba(0,184,255,0.2),rgba(0,229,212,0.2))] text-fg' : 'text-muted')}>
              {y ? 'Yıllık · 2 ay hediye' : 'Aylık'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => {
          const price = yearly ? Math.round((p.price * 10) / 12) : p.price;
          return (
            <Card key={p.id} variant={p.featured ? 'feature' : 'solid'} className={cn('flex flex-col p-7', p.featured && 'border-neon/40 shadow-[0_30px_80px_-30px_rgba(0,229,212,0.4)] lg:-translate-y-3')}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', p.featured ? 'bg-neon/15 text-neon' : 'border border-line text-muted')}>{p.tag}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{p.desc}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="tabular font-display text-4xl font-semibold">{p.price === 0 ? '₺0' : fmt.try(price)}</span>
                <span className="text-sm text-subtle">/ {p.unit ?? 'ay'}</span>
              </p>
              {yearly && p.price > 0 && <p className="text-xs text-subtle">yıllık {fmt.try(p.price * 10)} faturalandırılır</p>}
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-neon" aria-hidden />
                    <span className="text-fg/90">{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={p.featured ? 'primary' : 'secondary'} className="mt-8 w-full">
                <Link href={p.href}>{p.cta}</Link>
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
