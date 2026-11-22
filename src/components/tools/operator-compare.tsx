'use client';

import { useMemo, useState } from 'react';
import { ArrowDownUp, Check, Minus, Trophy } from 'lucide-react';
import { SAMPLE_OPERATORS, sessionCost, type SampleOperator } from '@/lib/data/operators';
import { RangeField } from '@/components/ui/range-field';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn, fmt } from '@/lib/utils';

type Tier = 'ac' | 'dc' | 'hpc';
const TIERS: { id: Tier; label: string }[] = [
  { id: 'ac', label: 'AC' },
  { id: 'dc', label: 'DC' },
  { id: 'hpc', label: 'HPC 150 kW+' },
];

export function OperatorCompare() {
  const [kwh, setKwh] = useState(35);
  const [tier, setTier] = useState<Tier>('dc');
  const [idle, setIdle] = useState(0);
  const [ops, setOps] = useState<SampleOperator[]>(SAMPLE_OPERATORS);
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo(() => {
    const r = ops.map((o) => ({ o, cost: sessionCost(o, kwh, tier, idle) }));
    return r.sort((a, b) => (sortAsc ? a.cost - b.cost : b.cost - a.cost));
  }, [ops, kwh, tier, idle, sortAsc]);
  const best = Math.min(...rows.map((r) => r.cost));
  const priceKey = tier === 'ac' ? 'acPrice' : tier === 'dc' ? 'dcPrice' : 'hpcPrice';

  const updatePrice = (id: string, v: number) => setOps((x) => x.map((o) => (o.id === id ? { ...o, [priceKey]: v } : o)));

  return (
    <div className="space-y-6">
      <Card variant="glass" className="grid gap-6 p-5 sm:p-7 md:grid-cols-3">
        <RangeField label="Şarj edilecek enerji" value={kwh} min={5} max={90} onChange={setKwh} format={(n) => `${n} kWh`} />
        <RangeField label="Şarj sonrası bekleme" value={idle} min={0} max={60} step={5} onChange={setIdle} format={(n) => `${n} dk`} />
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted">Şarj tipi</legend>
          <div className="grid grid-cols-3 gap-2">
            {TIERS.map((t) => (
              <button key={t.id} type="button" aria-pressed={tier === t.id} onClick={() => setTier(t.id)} className={cn('min-h-11 rounded-xl border px-2 text-sm font-semibold', tier === t.id ? 'border-neon/60 bg-neon/10 text-fg' : 'border-line text-muted')}>
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>
      </Card>

      {/* Masaüstü tablo */}
      <div className="hidden overflow-hidden rounded-3xl border border-line md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Örnek operatör tarifelerinin karşılaştırması</caption>
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-5 py-4">Operatör</th>
              <th scope="col" className="px-4 py-4">Kapsam</th>
              <th scope="col" className="px-4 py-4">Birim fiyat (₺/kWh)</th>
              <th scope="col" className="px-4 py-4">Maks. güç</th>
              <th scope="col" className="px-4 py-4">RFID</th>
              <th scope="col" className="px-4 py-4">Rezervasyon</th>
              <th scope="col" className="px-4 py-4">Roaming</th>
              <th scope="col" className="px-5 py-4 text-right">
                <button type="button" onClick={() => setSortAsc((s) => !s)} className="inline-flex min-h-9 items-center gap-1.5 uppercase hover:text-fg">
                  Oturum maliyeti <ArrowDownUp className="size-3.5" aria-hidden />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface/40">
            {rows.map(({ o, cost }) => (
              <tr key={o.id} className={cn('transition-colors hover:bg-white/[0.02]', cost === best && 'bg-neon/[0.04]')}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="size-2.5 rounded-full" style={{ background: o.color }} aria-hidden />
                    <div>
                      <p className="font-semibold text-fg">{o.name}</p>
                      <p className="max-w-[220px] text-xs text-subtle">{o.profile}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted">{o.coverage}</td>
                <td className="px-4 py-4">
                  <Input aria-label={`${o.name} birim fiyat`} type="number" step={0.1} min={0} value={o[priceKey]} onChange={(e) => updatePrice(o.id, Math.max(0, Number(e.target.value) || 0))} className="min-h-10 w-24 px-3 text-sm" />
                </td>
                <td className="tabular px-4 py-4 text-muted">{o.maxKw} kW</td>
                {[o.rfid, o.reservation, o.roaming].map((b, i) => (
                  <td key={i} className="px-4 py-4">{b ? <Check className="size-4 text-ok" aria-label="Var" /> : <Minus className="size-4 text-subtle" aria-label="Yok" />}</td>
                ))}
                <td className="px-5 py-4 text-right">
                  <span className="tabular font-display text-lg font-semibold text-fg">{fmt.try2(cost)}</span>
                  {cost === best && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-neon/10 px-2 py-0.5 text-[11px] font-semibold text-neon"><Trophy className="size-3" aria-hidden />En uygun</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobil kartlar */}
      <ul className="space-y-3 md:hidden">
        {rows.map(({ o, cost }) => (
          <li key={o.id}>
            <Card className={cn('p-4', cost === best && 'border-neon/40')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold"><span className="size-2.5 rounded-full" style={{ background: o.color }} aria-hidden />{o.name}</p>
                  <p className="text-xs text-subtle">{o.coverage} · {o.maxKw} kW</p>
                </div>
                <div className="text-right">
                  <p className="tabular font-display text-lg font-semibold">{fmt.try2(cost)}</p>
                  {cost === best && <p className="text-[11px] font-semibold text-neon">En uygun</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                <label className="flex items-center gap-2">
                  ₺/kWh
                  <Input type="number" step={0.1} min={0} value={o[priceKey]} onChange={(e) => updatePrice(o.id, Math.max(0, Number(e.target.value) || 0))} className="min-h-11 w-24 px-3 text-sm" />
                </label>
                {o.rfid && <span className="rounded-full border border-line px-2 py-1">RFID</span>}
                {o.reservation && <span className="rounded-full border border-line px-2 py-1">Rezervasyon</span>}
                {o.roaming && <span className="rounded-full border border-line px-2 py-1">Roaming</span>}
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3 text-xs text-subtle">
        <StatusBadge status="sample" /> Operatör adları anonimleştirilmiştir; fiyatlar düzenlenebilir örnek değerlerdir. Oturum maliyeti = oturum ücreti + enerji × birim fiyat + bekleme ücreti.
      </div>
    </div>
  );
}
