'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Clock3, Wallet, Navigation } from 'lucide-react';
import { VEHICLE_PROFILES } from '@/lib/data/vehicles';
import { usePreferredVehicle } from '@/lib/preferred-vehicle';
import { computeCharge } from '@/lib/calc/charging';
import { RangeField } from '@/components/ui/range-field';
import { Select } from '@/components/ui/input';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { fmt } from '@/lib/utils';

export function QuickEstimate() {
  const [vid, setVid] = usePreferredVehicle();
  const [start, setStart] = useState(20);
  const [target, setTarget] = useState(80);
  const v = VEHICLE_PROFILES.find((x) => x.id === vid)!;
  const r = useMemo(
    () =>
      computeCharge({
        batteryKwh: v.batteryKwh,
        startSoc: start,
        targetSoc: Math.max(target, start + 1),
        chargerKw: 180,
        vehicleMaxKw: v.maxDcKw,
        type: 'DC',
        pricePerKwh: 13.9,
        consumptionKwhPer100: v.consumptionKwhPer100,
      }),
    [v, start, target],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-5">
        <div>
          <label htmlFor="qe-vehicle" className="mb-2 block text-sm font-medium text-muted">
            Araç profili
          </label>
          <Select id="qe-vehicle" value={vid} onChange={(e) => setVid(e.target.value)}>
            {VEHICLE_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.batteryKwh} kWh
              </option>
            ))}
          </Select>
        </div>
        <RangeField label="Mevcut şarj" value={start} min={0} max={95} onChange={(n) => { setStart(n); if (n >= target) setTarget(Math.min(100, n + 5)); }} format={(n) => `%${n}`} />
        <RangeField label="Hedef şarj" value={target} min={5} max={100} onChange={(n) => setTarget(Math.max(n, start + 1))} format={(n) => `%${n}`} />
        <p className="text-xs text-subtle">180 kW DC istasyon, 13,90 ₺/kWh örnek tarife ile hesaplanır.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-3 lg:grid-cols-1">
        {[
          { icon: Wallet, label: 'Tahmini maliyet', value: r.cost, f: fmt.try },
          { icon: Clock3, label: 'Şarj süresi', value: r.minutes, f: fmt.duration },
          { icon: Navigation, label: 'Eklenen menzil', value: r.rangeAddedKm, f: (n: number) => `${fmt.int(n)} km` },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-line bg-bg-2/60 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,rgba(0,184,255,0.2),rgba(0,229,212,0.12))] text-neon">
              <s.icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">{s.label}</p>
              <AnimatedNumber value={s.value} format={s.f} className="tabular block font-display text-xl font-semibold text-fg sm:text-2xl" />
            </div>
          </div>
        ))}
        <Button asChild variant="outline" className="min-[400px]:col-span-3 lg:col-span-1">
          <Link href="/hesaplayici">
            Detaylı hesaplayıcı <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
