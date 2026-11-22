'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { projectRevenue, REVENUE_PRESETS, cagr, type RevenueInput } from '@/lib/calc/revenue';
import { RangeField } from '@/components/ui/range-field';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable } from '@/components/charts/chart-tooltip';

const RevenueChart = dynamic(() => import('@/components/charts/revenue-chart'), { ssr: false, loading: () => <div className="size-full animate-pulse rounded-2xl bg-white/[0.03]" /> });
import { cn, fmt } from '@/lib/utils';

const PRESET_LABEL = { muhafazakar: 'Muhafazakâr', baz: 'Baz', iddiali: 'İddialı' } as const;

export function RevenueModel() {
  const [preset, setPreset] = useState<keyof typeof REVENUE_PRESETS>('baz');
  const [input, setInput] = useState<RevenueInput>(REVENUE_PRESETS.baz);
  const rows = useMemo(() => projectRevenue(input), [input]);
  const set = (k: keyof RevenueInput) => (v: number) => setInput((i) => ({ ...i, [k]: v }));
  const last = rows[rows.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(REVENUE_PRESETS) as (keyof typeof REVENUE_PRESETS)[]).map((p) => (
          <button key={p} type="button" aria-pressed={preset === p} onClick={() => { setPreset(p); setInput(REVENUE_PRESETS[p]); }} className={cn('min-h-11 rounded-full border px-5 text-sm font-semibold', preset === p ? 'border-neon/60 bg-neon/10 text-fg' : 'border-line text-muted hover:text-fg')}>
            {PRESET_LABEL[p]} senaryo
          </button>
        ))}
        <StatusBadge status="model" className="ml-auto" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card variant="glass" className="space-y-4 p-5 sm:p-6">
          <RangeField label="1. yıl kullanıcı" value={input.usersY1} min={1000} max={100000} step={1000} onChange={set('usersY1')} format={fmt.int} />
          <RangeField label="Yıllık kullanıcı büyümesi" value={input.userGrowthPct} min={10} max={200} step={5} onChange={set('userGrowthPct')} format={(n) => `%${n}`} />
          <RangeField label="Ücretli dönüşüm" value={input.paidConversionPct} min={1} max={20} step={0.5} onChange={set('paidConversionPct')} format={(n) => `%${fmt.num(n)}`} />
          <RangeField label="Aylık ARPU" value={input.arpuMonthly} min={49} max={299} onChange={set('arpuMonthly')} format={(n) => `₺${n}`} />
          <RangeField label="1. yıl filo müşterisi" value={input.fleetCustomersY1} min={1} max={100} onChange={set('fleetCustomersY1')} format={fmt.int} />
          <RangeField label="Filo başı araç" value={input.vehiclesPerFleet} min={5} max={200} step={5} onChange={set('vehiclesPerFleet')} format={fmt.int} />
          <RangeField label="Araç başı aylık ücret" value={input.fleetFeePerVehicleMonthly} min={99} max={799} step={10} onChange={set('fleetFeePerVehicleMonthly')} format={(n) => `₺${n}`} />
          <RangeField label="İşlem komisyonu" value={input.takeRatePct} min={0.5} max={5} step={0.1} onChange={set('takeRatePct')} format={(n) => `%${fmt.num(n)}`} />
        </Card>
        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-3">
            {[
              { l: `${input.years}. yıl gelir`, v: fmt.compactTry(last.total) },
              { l: 'Yıllık bileşik büyüme', v: `%${fmt.int(cagr(rows[0].total, last.total, rows.length - 1))}` },
              { l: `${input.years}. yıl brüt kâr`, v: fmt.compactTry(last.grossProfit) },
            ].map((s) => (
              <Card key={s.l} className="p-5">
                <p className="text-sm text-muted">{s.l}</p>
                <p className="tabular mt-1 font-display text-2xl font-semibold">{s.v}</p>
              </Card>
            ))}
          </div>
          <Card className="p-5 sm:p-6">
            <h3 className="font-display text-lg font-semibold">Gelir kırılımı</h3>
            <p className="text-sm text-muted">Yıllara göre gelir kalemleri (₺)</p>
            <div className="mt-5 h-72">
              <RevenueChart rows={rows} />
            </div>
            <DataTable
              caption="Gelir senaryosu"
              columns={['Yıl', 'Kullanıcı', 'Ücretli', 'Filo aracı', 'Toplam gelir']}
              rows={rows.map((r) => [r.year, fmt.int(r.users), fmt.int(r.paidUsers), fmt.int(r.fleetVehicles), fmt.compactTry(r.total)])}
            />
          </Card>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-subtle">
        Bu model, değiştirilebilir varsayımlara dayalı açıklayıcı bir hesaptır; gerçekleşmiş sonuç, finansal tahmin, yatırım tavsiyesi veya ileriye dönük taahhüt değildir.
      </p>
    </div>
  );
}
