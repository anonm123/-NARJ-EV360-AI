'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Leaf, Trees, Factory, Zap } from 'lucide-react';
import { computeCarbon, CARBON_DEFAULTS } from '@/lib/calc/carbon';
import { RangeField } from '@/components/ui/range-field';
import { Card } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { DataTable } from '@/components/charts/chart-tooltip';

const CarbonChart = dynamic(() => import('@/components/charts/carbon-chart'), { ssr: false, loading: () => <div className="size-full animate-pulse rounded-2xl bg-white/[0.03]" /> });
import { cn, fmt } from '@/lib/utils';

export function CarbonCalculator() {
  const [km, setKm] = useState(18000);
  const [ev, setEv] = useState(17);
  const [ice, setIce] = useState(6.8);
  const [fuel, setFuel] = useState<'gasoline' | 'diesel'>('gasoline');
  const [grid, setGrid] = useState(CARBON_DEFAULTS.gridKgPerKwh);
  const [renew, setRenew] = useState(20);
  const [fleet, setFleet] = useState(1);

  const r = useMemo(() => computeCarbon({ kmPerYear: km, evKwhPer100: ev, iceLitersPer100: ice, fuel, gridKgPerKwh: grid, renewableShare: renew }), [km, ev, ice, fuel, grid, renew]);
  const data = [
    { name: 'Fosil yakıtlı', kg: r.iceKg * fleet },
    { name: 'Elektrikli', kg: r.evKg * fleet },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <Card variant="glass" className="space-y-5 p-5 sm:p-7">
        <h2 className="font-display text-lg font-semibold">Kullanım profili</h2>
        <RangeField label="Yıllık mesafe (araç başı)" value={km} min={2000} max={80000} step={1000} onChange={setKm} format={(n) => `${fmt.int(n)} km`} />
        <RangeField label="Araç sayısı" value={fleet} min={1} max={500} onChange={setFleet} format={(n) => `${n} araç`} />
        <RangeField label="EV tüketimi" value={ev} min={10} max={35} step={0.5} onChange={setEv} format={(n) => `${fmt.num(n)} kWh/100km`} />
        <RangeField label="Yenilenebilir şarj payı" value={renew} min={0} max={100} step={5} onChange={setRenew} format={(n) => `%${n}`} />
        <RangeField label="Şebeke emisyon faktörü" value={grid} min={0.1} max={0.8} step={0.01} onChange={setGrid} format={(n) => `${fmt.num(n)} kg/kWh`} hint="Varsayılan ≈0,44 (yaklaşık). Güncel resmi değerle değiştirin." />
        <RangeField label="Karşılaştırılan araç tüketimi" value={ice} min={3} max={15} step={0.1} onChange={setIce} format={(n) => `${fmt.num(n)} L/100km`} />
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Yakıt tipi">
          {(['gasoline', 'diesel'] as const).map((f) => (
            <button key={f} type="button" role="radio" aria-checked={fuel === f} onClick={() => setFuel(f)} className={cn('min-h-11 rounded-xl border text-sm font-semibold', fuel === f ? 'border-neon/60 bg-neon/10' : 'border-line text-muted')}>
              {f === 'gasoline' ? 'Benzin' : 'Dizel'}
            </button>
          ))}
        </div>
      </Card>
      <div className="min-w-0 space-y-6">
        <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 xl:grid-cols-4">
          {[
            { i: Leaf, l: 'Yıllık CO₂ tasarrufu', v: (r.savedKg * fleet) / 1000, f: (n: number) => `${fmt.num(n)} ton` },
            { i: Factory, l: 'Emisyon azalması', v: r.savedPct, f: (n: number) => `%${fmt.int(n)}` },
            { i: Trees, l: 'Ağaç eşdeğeri', v: r.treeEquivalent * fleet, f: (n: number) => fmt.int(n) },
            { i: Zap, l: 'Yıllık enerji', v: r.evKwh * fleet, f: (n: number) => `${fmt.int(n)} kWh` },
          ].map((s) => (
            <Card key={s.l} className="p-5">
              <s.i className="size-5 text-neon" aria-hidden />
              <p className="mt-3 text-sm text-muted">{s.l}</p>
              <AnimatedNumber value={s.v} format={s.f} className="tabular block font-display text-2xl font-semibold" />
            </Card>
          ))}
        </div>
        <Card className="p-5 sm:p-6">
          <h3 className="font-display text-lg font-semibold">Yıllık emisyon karşılaştırması</h3>
          <p className="text-sm text-muted">kg CO₂ / yıl · {fleet} araç</p>
          <div className="mt-5 h-64">
            <CarbonChart data={data} />
          </div>
          <DataTable caption="Emisyon karşılaştırması" columns={['Araç tipi', 'kg CO₂/yıl']} rows={data.map((d) => [d.name, fmt.int(d.kg)])} />
        </Card>
      </div>
    </div>
  );
}
