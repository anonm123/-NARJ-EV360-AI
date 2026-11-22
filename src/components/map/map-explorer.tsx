'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Feature } from 'geojson';
import { Search, SlidersHorizontal, X, Zap, Clock, CalendarClock } from 'lucide-react';
import { SAMPLE_STATIONS, STATUS_LABEL, type Connector, type Station } from '@/lib/data/stations';
import { SAMPLE_OPERATORS } from '@/lib/data/operators';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn, fmt } from '@/lib/utils';

const StationMap = dynamic(() => import('./station-map'), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center bg-[radial-gradient(ellipse_at_center,#0c1a2b,#050A12)] text-sm text-muted">
      <span className="flex items-center gap-2"><Zap className="size-4 animate-pulse text-neon" aria-hidden /> Harita yükleniyor…</span>
    </div>
  ),
});

const CONNECTORS: Connector[] = ['CCS2', 'Type 2', 'CHAdeMO'];
const STATUS_DOT = { available: 'bg-neon', busy: 'bg-warn', offline: 'bg-subtle' } as const;

export function MapExplorer({ outline }: { outline: Feature }) {
  const [q, setQ] = useState('');
  const [conns, setConns] = useState<Connector[]>([]);
  const [minKw, setMinKw] = useState(0);
  const [op, setOp] = useState('');
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [only24, setOnly24] = useState(false);
  const [selected, setSelected] = useState<Station | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [limit, setLimit] = useState(12);

  const results = useMemo(() => {
    const term = q.trim().toLocaleLowerCase('tr');
    return SAMPLE_STATIONS.filter(
      (s) =>
        (!term || s.name.toLocaleLowerCase('tr').includes(term) || s.city.toLocaleLowerCase('tr').includes(term)) &&
        (conns.length === 0 || conns.some((c) => s.connectors.includes(c))) &&
        s.maxKw >= minKw &&
        (!op || s.operatorId === op) &&
        (!onlyAvail || s.demoStatus === 'available') &&
        (!only24 || s.open24h),
    ).sort((a, b) => b.maxKw - a.maxKw);
  }, [q, conns, minKw, op, onlyAvail, only24]);

  const activeCount = conns.length + (minKw ? 1 : 0) + (op ? 1 : 0) + (onlyAvail ? 1 : 0) + (only24 ? 1 : 0);
  const reset = () => { setConns([]); setMinKw(0); setOp(''); setOnlyAvail(false); setOnly24(false); setQ(''); };

  const filters = (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">Soket tipi</legend>
        <div className="flex flex-wrap gap-2">
          {CONNECTORS.map((c) => {
            const on = conns.includes(c);
            return (
              <button key={c} type="button" aria-pressed={on} onClick={() => setConns((x) => (on ? x.filter((y) => y !== c) : [...x, c]))} className={cn('min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors', on ? 'border-neon/60 bg-neon/10 text-fg' : 'border-line text-muted hover:text-fg')}>
                {c}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div>
        <label htmlFor="mx-kw" className="mb-2 block text-sm font-medium text-muted">Minimum güç</label>
        <Select id="mx-kw" value={minKw} onChange={(e) => setMinKw(Number(e.target.value))}>
          <option value={0}>Tümü</option>
          <option value={50}>50 kW+ (DC)</option>
          <option value={120}>120 kW+</option>
          <option value={180}>180 kW+ (HPC)</option>
        </Select>
      </div>
      <div>
        <label htmlFor="mx-op" className="mb-2 block text-sm font-medium text-muted">Operatör (örnek)</label>
        <Select id="mx-op" value={op} onChange={(e) => setOp(e.target.value)}>
          <option value="">Tümü</option>
          {SAMPLE_OPERATORS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </Select>
      </div>
      <div className="space-y-1">
        {[
          { l: 'Sadece müsait (simülasyon)', v: onlyAvail, s: setOnlyAvail },
          { l: '7/24 açık', v: only24, s: setOnly24 },
        ].map((t) => (
          <label key={t.l} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm text-fg">
            {t.l}
            <input type="checkbox" checked={t.v} onChange={(e) => t.s(e.target.checked)} className="size-5 accent-[#00E5D4]" />
          </label>
        ))}
      </div>
      {activeCount > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Filtreleri temizle</Button>
      )}
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* Sol panel */}
      <aside className="order-2 min-w-0 space-y-4 lg:order-1">
        <div className="glass rounded-3xl p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <Input aria-label="Şehir veya istasyon ara" placeholder="Şehir veya istasyon ara" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 lg:hidden">
            <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} aria-controls="mx-filters">
              {filtersOpen ? <X aria-hidden /> : <SlidersHorizontal aria-hidden />} Filtreler {activeCount > 0 && `(${activeCount})`}
            </Button>
            <span className="text-sm text-muted">{results.length} nokta</span>
          </div>
          <div id="mx-filters" className={cn('mt-5 lg:block', filtersOpen ? 'block' : 'hidden')}>
            {filters}
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-surface/60">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-fg">{results.length} sonuç</p>
            <StatusBadge status="sample" />
          </div>
          <ul className="max-h-[520px] divide-y divide-line overflow-y-auto overscroll-contain">
            {results.slice(0, limit).map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => setSelected(s)} className={cn('flex w-full min-h-16 items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]', selected?.id === s.id && 'bg-neon/5')}>
                  <span className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', STATUS_DOT[s.demoStatus])} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">{s.name}</span>
                    <span className="block text-xs text-muted">{s.operator} · {s.site} · {s.connectors.join(', ')}</span>
                    <span className="sr-only">{STATUS_LABEL[s.demoStatus]}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="tabular block text-sm font-semibold text-fg">{s.maxKw} kW</span>
                    <span className="tabular block text-xs text-subtle">{fmt.num(s.pricePerKwh)} ₺</span>
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="p-6 text-center text-sm text-muted">Filtrelere uyan nokta yok.</li>}
          </ul>
          {results.length > limit && (
            <div className="border-t border-line p-3">
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setLimit((l) => l + 12)}>Daha fazla göster</Button>
            </div>
          )}
        </div>
      </aside>

      {/* Harita */}
      <div className="order-1 min-w-0 lg:order-2">
        <div className="relative h-[58svh] min-h-[360px] overflow-hidden rounded-3xl border border-line lg:h-[720px]">
          <StationMap stations={results} outline={outline} selected={selected} onSelect={setSelected} />
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex flex-wrap gap-1.5 rounded-2xl border border-line bg-bg/85 px-3 py-2 text-[11px] text-muted backdrop-blur">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-neon" />Müsait</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warn" />Dolu</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-subtle" />Bakımda</span>
            <span className="text-subtle">· simülasyon</span>
          </div>
        </div>
        {selected && (
          <div className="glass mt-4 flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold">{selected.name}</p>
              <p className="text-sm text-muted">
                {selected.operator} · {selected.maxKw} kW · {selected.points} soket · {selected.connectors.join(', ')}
              </p>
              <p className="mt-1 flex items-center gap-3 text-xs text-subtle">
                <span className="flex items-center gap-1"><Clock className="size-3.5" aria-hidden /> {selected.open24h ? '7/24' : '08:00–22:00'}</span>
                <span>{STATUS_LABEL[selected.demoStatus]}</span>
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={`/rezervasyon?istasyon=${selected.id}`}>
                <CalendarClock aria-hidden /> Rezervasyon demo
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
