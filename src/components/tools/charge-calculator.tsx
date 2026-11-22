'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Zap, PlugZap, Clock3, Wallet, Navigation, Fuel, TrendingDown } from 'lucide-react';
import { VEHICLE_PROFILES } from '@/lib/data/vehicles';
import { computeCharge, costPer100Km, type ChargerType } from '@/lib/calc/charging';
import { RangeField } from '@/components/ui/range-field';
import { Field, Input, Select } from '@/components/ui/input';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable } from '@/components/charts/chart-tooltip';
import { SINGLE } from '@/lib/chart-theme';

const CurveChart = dynamic(() => import('@/components/charts/curve-chart'), { ssr: false, loading: () => <div className="size-full animate-pulse rounded-2xl bg-white/[0.03]" /> });
import { cn, fmt } from '@/lib/utils';

const CHARGERS: { kw: number; type: ChargerType; label: string; price: number }[] = [
  { kw: 7.4, type: 'AC', label: 'Ev / Wallbox 7,4 kW', price: 3.2 },
  { kw: 22, type: 'AC', label: 'AC 22 kW', price: 9.9 },
  { kw: 60, type: 'DC', label: 'DC 60 kW', price: 13.4 },
  { kw: 120, type: 'DC', label: 'DC 120 kW', price: 13.9 },
  { kw: 180, type: 'DC', label: 'HPC 180 kW', price: 15.9 },
  { kw: 300, type: 'DC', label: 'HPC 300 kW', price: 16.4 },
];

export function ChargeCalculator() {
  const [vid, setVid] = useState('kompakt-suv');
  const v = VEHICLE_PROFILES.find((x) => x.id === vid)!;
  const [battery, setBattery] = useState(v.batteryKwh);
  const [consumption, setConsumption] = useState(v.consumptionKwhPer100);
  const [start, setStart] = useState(15);
  const [target, setTarget] = useState(80);
  const [chargerIdx, setChargerIdx] = useState(3);
  const [price, setPrice] = useState(CHARGERS[3].price);
  const [fuelPrice, setFuelPrice] = useState(50);
  const [iceL, setIceL] = useState(6.8);

  const charger = CHARGERS[chargerIdx];
  const vehicleMax = charger.type === 'AC' ? v.maxAcKw : v.maxDcKw;

  const result = useMemo(() => {
    try {
      return { ok: computeCharge({ batteryKwh: battery, startSoc: start, targetSoc: target, chargerKw: charger.kw, vehicleMaxKw: vehicleMax, type: charger.type, pricePerKwh: price, consumptionKwhPer100: consumption }) };
    } catch (e) {
      return { err: (e as Error).message };
    }
  }, [battery, start, target, charger, vehicleMax, price, consumption]);
  const per100 = costPer100Km({ consumptionKwhPer100: consumption, pricePerKwh: price, efficiency: charger.type === 'AC' ? 0.9 : 0.94, iceLitersPer100: iceL, fuelPricePerLiter: fuelPrice });

  const pickVehicle = (id: string) => {
    const nv = VEHICLE_PROFILES.find((x) => x.id === id)!;
    setVid(id);
    setBattery(nv.batteryKwh);
    setConsumption(nv.consumptionKwhPer100);
  };

  const r = result.ok;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      {/* Girdi paneli */}
      <Card variant="glass" className="p-5 sm:p-7 lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-display text-lg font-semibold">Parametreler</h2>
        <div className="mt-5 space-y-5">
          <Field label="Araç profili" htmlFor="cc-v">
            <Select id="cc-v" value={vid} onChange={(e) => pickVehicle(e.target.value)}>
              {VEHICLE_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.segment})</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
            <Field label="Kullanılabilir batarya (kWh)" htmlFor="cc-b">
              <Input id="cc-b" type="number" inputMode="decimal" min={10} max={250} value={battery} onChange={(e) => setBattery(Math.max(1, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Tüketim (kWh/100 km)" htmlFor="cc-c">
              <Input id="cc-c" type="number" inputMode="decimal" min={8} max={45} step={0.1} value={consumption} onChange={(e) => setConsumption(Math.max(1, Number(e.target.value) || 0))} />
            </Field>
          </div>
          <RangeField label="Mevcut şarj" value={start} min={0} max={95} onChange={(n) => { setStart(n); if (n >= target) setTarget(Math.min(100, n + 5)); }} format={(n) => `%${n}`} />
          <RangeField label="Hedef şarj" value={target} min={5} max={100} onChange={(n) => setTarget(Math.max(n, start + 1))} format={(n) => `%${n}`} />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-muted">Şarj istasyonu</legend>
            <div className="grid grid-cols-2 gap-2">
              {CHARGERS.map((c, i) => (
                <label key={c.label} className={cn('flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm transition-colors', i === chargerIdx ? 'border-neon/60 bg-neon/8 text-fg' : 'border-line text-muted hover:border-line-strong')}>
                  <input type="radio" name="charger" className="sr-only" checked={i === chargerIdx} onChange={() => { setChargerIdx(i); setPrice(c.price); }} />
                  {c.type === 'AC' ? <PlugZap className="size-4 shrink-0 text-electric" aria-hidden /> : <Zap className="size-4 shrink-0 text-neon" aria-hidden />}
                  <span className="min-w-0 leading-tight">{c.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Birim fiyat (₺/kWh)" htmlFor="cc-p" hint="Örnek tarife; kendi operatörünüzün fiyatını girin.">
            <Input id="cc-p" type="number" inputMode="decimal" min={0} step={0.1} value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <details className="rounded-xl border border-line p-3">
            <summary className="min-h-8 cursor-pointer text-sm font-semibold text-muted">Fosil yakıt karşılaştırması</summary>
            <div className="mt-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
              <Field label="Yakıt (₺/L)" htmlFor="cc-f"><Input id="cc-f" type="number" inputMode="decimal" step={0.1} value={fuelPrice} onChange={(e) => setFuelPrice(Math.max(0, Number(e.target.value) || 0))} /></Field>
              <Field label="Tüketim (L/100 km)" htmlFor="cc-l"><Input id="cc-l" type="number" inputMode="decimal" step={0.1} value={iceL} onChange={(e) => setIceL(Math.max(0, Number(e.target.value) || 0))} /></Field>
            </div>
          </details>
        </div>
      </Card>

      {/* Sonuçlar */}
      <div className="min-w-0 space-y-6">
        {result.err ? (
          <Card className="p-6 text-danger" role="alert">{result.err}</Card>
        ) : r ? (
          <>
            <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Wallet, l: 'Tahmini maliyet', v: r.cost, f: fmt.try, accent: true },
                { icon: Clock3, l: 'Şarj süresi', v: r.minutes, f: fmt.duration },
                { icon: Navigation, l: 'Eklenen menzil', v: r.rangeAddedKm, f: (n: number) => `${fmt.int(n)} km` },
                { icon: Zap, l: 'Şebekeden enerji', v: r.energyFromGridKwh, f: (n: number) => `${fmt.num(n)} kWh` },
              ].map((s) => (
                <Card key={s.l} variant={s.accent ? 'feature' : 'solid'} className={cn('p-5', s.accent && 'border-neon/30')}>
                  <s.icon className="size-5 text-neon" aria-hidden />
                  <p className="mt-3 text-sm text-muted">{s.l}</p>
                  <AnimatedNumber value={s.v} format={s.f} className="tabular mt-1 block font-display text-2xl font-semibold sm:text-[1.7rem]" />
                </Card>
              ))}
            </div>

            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">Şarj eğrisi</h3>
                  <p className="text-sm text-muted">Şarj seviyesine göre etkin güç (kW). Ortalama {fmt.num(r.avgPowerKw)} kW · tepe {fmt.num(r.peakPowerKw)} kW</p>
                </div>
                <StatusBadge status="model" />
              </div>
              <div className="mt-5 h-64 w-full">
                <CurveChart data={r.curve} start={start} target={target} />
              </div>
              <DataTable caption="Şarj eğrisi verisi" columns={['Şarj %', 'Güç (kW)', 'Dakika']} rows={r.curve.filter((_, i) => i % 3 === 0).map((p) => [`%${Math.round(p.soc)}`, fmt.num(p.kw), fmt.num(p.minute)])} />
            </Card>

            <Card variant="feature" className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">100 km başına maliyet</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/10 px-3 py-1 text-sm font-semibold text-ok">
                  <TrendingDown className="size-4" aria-hidden /> %{fmt.int(per100.savingsPct)} tasarruf
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  { l: 'Elektrikli araç', v: per100.ev, icon: Zap, w: per100.ev },
                  { l: 'Fosil yakıtlı araç', v: per100.ice, icon: Fuel, w: per100.ice },
                ].map((row, i) => (
                  <div key={row.l}>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted"><row.icon className="size-4" aria-hidden /> {row.l}</span>
                      <span className="tabular font-semibold text-fg">{fmt.try(row.v)}</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-white/5">
                      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${(row.w / Math.max(per100.ev, per100.ice)) * 100}%`, background: i === 0 ? SINGLE : '#C07330' }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-subtle">Varsayılan yakıt fiyatı ve tüketim değerleri örnektir; kendi değerlerinizi girin.</p>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
