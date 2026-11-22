'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import { ArrowLeftRight, BatteryCharging, Clock3, Flag, Leaf, MapPin, Save, Wallet, Zap } from 'lucide-react';
import { CITIES } from '@/lib/data/cities';
import { VEHICLE_PROFILES } from '@/lib/data/vehicles';
import { planRoute, type RouteMode } from '@/lib/calc/route';
import { saveRouteAction } from '@/app/actions/panel';
import { Card } from '@/components/ui/card';
import { Field, Select } from '@/components/ui/input';
import { RangeField } from '@/components/ui/range-field';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { DataTable } from '@/components/charts/chart-tooltip';

const SocChart = dynamic(() => import('@/components/charts/soc-chart'), { ssr: false, loading: () => <div className="size-full animate-pulse rounded-2xl bg-white/[0.03]" /> });
import { cn, fmt } from '@/lib/utils';

const MODES: { id: RouteMode; label: string; desc: string }[] = [
  { id: 'fastest', label: 'En hızlı', desc: 'Yüksek güçlü HPC, %75 hedef' },
  { id: 'balanced', label: 'Dengeli', desc: '180 kW, %80 hedef' },
  { id: 'cheapest', label: 'En ekonomik', desc: 'Uygun tarifeli 60 kW' },
];

export interface MapGeometry {
  path: string;
  width: number;
  height: number;
  cities: Record<string, [number, number]>;
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number };
}

export function RoutePlanner({ geo }: { geo: MapGeometry }) {
  const reduce = useReducedMotion();
  const [from, setFrom] = useState('istanbul');
  const [to, setTo] = useState('antalya');
  const [vid, setVid] = useState('kompakt-suv');
  const [startSoc, setStartSoc] = useState(85);
  const [arrival, setArrival] = useState(15);
  const [mode, setMode] = useState<RouteMode>('balanced');
  const [speed, setSpeed] = useState(110);
  const [temp, setTemp] = useState(18);
  const [price, setPrice] = useState(13.9);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const vehicle = VEHICLE_PROFILES.find((v) => v.id === vid)!;
  const res = useMemo(() => {
    const a = CITIES.find((c) => c.id === from)!;
    const b = CITIES.find((c) => c.id === to)!;
    try {
      return { plan: planRoute({ from: a, to: b, batteryKwh: vehicle.batteryKwh, consumptionKwhPer100: vehicle.consumptionKwhPer100, maxDcKw: vehicle.maxDcKw, startSoc, arrivalMinSoc: arrival, mode, speedKmh: speed, tempC: temp, dcPricePerKwh: price }) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [from, to, vehicle, startSoc, arrival, mode, speed, temp, price]);

  const project = (lat: number, lng: number) => {
    const { minLng, maxLng, minLat, maxLat } = geo.bounds;
    return [((lng - minLng) / (maxLng - minLng)) * geo.width, ((maxLat - lat) / (maxLat - minLat)) * geo.height] as const;
  };

  const plan = res.plan;
  const pts = plan?.path.map((p) => project(p.lat, p.lng)) ?? [];
  const d = pts.length
    ? pts
        .map(([x, y], i) => {
          if (i === 0) return `M${x},${y}`;
          const [px, py] = pts[i - 1];
          const mx = (px + x) / 2;
          const my = (py + y) / 2 - Math.abs(x - px) * 0.08;
          return `Q${mx},${my} ${x},${y}`;
        })
        .join(' ')
    : '';

  const onSave = () => {
    if (!plan) return;
    start(async () => {
      const r = await saveRouteAction({ fromId: from, toId: to, distanceKm: plan.distanceKm, totalMinutes: plan.totalMinutes, totalCost: plan.totalCost, stops: plan.stops.length });
      setSaveMsg(r.message ?? null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Kontrol paneli */}
      <Card variant="glass" className="p-5 sm:p-7">
        <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <Field label="Başlangıç" htmlFor="rp-from">
            <Select id="rp-from" value={from} onChange={(e) => setFrom(e.target.value)}>
              {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Button type="button" variant="outline" size="icon" className="mx-auto rotate-90 md:rotate-0" onClick={() => { setFrom(to); setTo(from); }} aria-label="Başlangıç ve varışı değiştir">
            <ArrowLeftRight aria-hidden />
          </Button>
          <Field label="Varış" htmlFor="rp-to">
            <Select id="rp-to" value={to} onChange={(e) => setTo(e.target.value)}>
              {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Araç profili" htmlFor="rp-v">
            <Select id="rp-v" value={vid} onChange={(e) => setVid(e.target.value)}>
              {VEHICLE_PROFILES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </Field>
          <RangeField label="Başlangıç şarjı" value={startSoc} min={20} max={100} onChange={setStartSoc} format={(n) => `%${n}`} />
          <RangeField label="Min. varış şarjı" value={arrival} min={5} max={50} onChange={setArrival} format={(n) => `%${n}`} />
          <RangeField label="Ortalama hız" value={speed} min={70} max={130} step={5} onChange={setSpeed} format={(n) => `${n} km/s`} />
          <RangeField label="Dış sıcaklık" value={temp} min={-15} max={42} onChange={setTemp} format={(n) => `${n}°C`} />
          <RangeField label="DC tarife" value={price} min={8} max={22} step={0.1} onChange={setPrice} format={(n) => `${fmt.num(n)} ₺/kWh`} />
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium text-muted">Optimizasyon modu</legend>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => (
                <label key={m.id} className={cn('flex min-h-14 cursor-pointer flex-col justify-center rounded-xl border px-3 py-2 transition-colors', mode === m.id ? 'border-neon/60 bg-neon/8' : 'border-line hover:border-line-strong')}>
                  <input type="radio" name="mode" className="sr-only" checked={mode === m.id} onChange={() => setMode(m.id)} />
                  <span className="text-sm font-semibold text-fg">{m.label}</span>
                  <span className="hidden text-[11px] leading-tight text-subtle sm:block">{m.desc}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>

      {res.error && (
        <Card className="border-danger/40 p-6 text-danger" role="alert">
          {res.error}
        </Card>
      )}

      {plan && (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          {/* Harita görselleştirmesi */}
          <Card variant="feature" className="overflow-hidden p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="font-display text-lg font-semibold">
                {CITIES.find((c) => c.id === from)?.name} → {CITIES.find((c) => c.id === to)?.name}
              </h2>
              <StatusBadge status="model" label="Tahmini rota" />
            </div>
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-line bg-[#060d18]">
              <div aria-hidden className="dot-texture absolute inset-0 opacity-40" />
              <svg viewBox={`0 0 ${geo.width} ${geo.height}`} className="relative w-full" role="img" aria-label={`Rota görselleştirmesi, ${plan.stops.length} şarj durağı`}>
                <defs>
                  <linearGradient id="rp-line" x1="0" x2="1">
                    <stop offset="0" stopColor="#00B8FF" />
                    <stop offset="1" stopColor="#00E5D4" />
                  </linearGradient>
                  <filter id="rp-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" />
                  </filter>
                </defs>
                <path d={geo.path} fill="#0c1a2b" stroke="rgba(0,184,255,0.35)" strokeWidth="1.5" />
                {Object.entries(geo.cities).map(([id, [x, y]]) => (
                  <circle key={id} cx={x} cy={y} r="3" fill="#9AAFC5" opacity="0.35" />
                ))}
                <path d={d} fill="none" stroke="#00E5D4" strokeWidth="8" opacity="0.35" filter="url(#rp-glow)" />
                <motion.path key={d} d={d} fill="none" stroke="url(#rp-line)" strokeWidth="4" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }} />
                {pts.map(([x, y], i) => {
                  const isEnd = i === 0 || i === pts.length - 1;
                  return (
                    <motion.g key={`${d}-${i}`} initial={reduce ? false : { opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduce ? 0 : 0.3 + (i / pts.length) * 1.3 }} style={{ transformOrigin: `${x}px ${y}px` }}>
                      {!isEnd && <circle cx={x} cy={y} r="18" fill="#00E5D4" opacity="0.15" />}
                      <circle cx={x} cy={y} r={isEnd ? 9 : 11} fill="#050A12" stroke={isEnd ? '#00B8FF' : '#00E5D4'} strokeWidth="3.5" />
                      {!isEnd && <path d={`M${x - 3} ${y - 6}h5l-2.5 4.5h4.5l-7 8 1.8-6h-3.8z`} fill="#00E5D4" />}
                    </motion.g>
                  );
                })}
              </svg>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { i: MapPin, l: 'Mesafe*', v: plan.distanceKm, f: (n: number) => `${fmt.int(n)} km` },
                { i: Clock3, l: 'Toplam süre', v: plan.totalMinutes, f: fmt.duration },
                { i: Wallet, l: 'Şarj maliyeti', v: plan.totalCost, f: fmt.try },
                { i: Leaf, l: 'CO₂ tasarrufu', v: plan.co2SavedKg, f: (n: number) => `${fmt.int(n)} kg` },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-line bg-bg-2/60 p-3.5">
                  <s.i className="size-4 text-neon" aria-hidden />
                  <p className="mt-2 text-xs text-muted">{s.l}</p>
                  <AnimatedNumber value={s.v} format={s.f} className="tabular block font-display text-lg font-semibold" />
                </div>
              ))}
            </div>
            <p className="mt-3 px-1 text-xs text-subtle">
              *Kuş uçuşu mesafe × 1,22 yol katsayısı ile tahmin edilmiştir. Şarj durakları rota üzerindeki temsili noktalardır; gerçek istasyon verisi operatör entegrasyonu ile gelecektir. Düzeltilmiş tüketim: {fmt.num(plan.adjustedConsumption)} kWh/100 km.
            </p>
          </Card>

          {/* Plan zaman çizelgesi */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">Yolculuk planı</h2>
            <ol className="mt-5">
              <TimelineItem icon={Flag} title={`${CITIES.find((c) => c.id === from)?.name} · çıkış`} meta={`Şarj %${startSoc}`} color="#00B8FF" />
              {plan.stops.map((s) => (
                <TimelineItem
                  key={s.index}
                  icon={BatteryCharging}
                  color="#00E5D4"
                  title={`Durak ${s.index} · ${s.nearCity} yakını`}
                  meta={`${fmt.int(s.km)}. km · %${Math.round(s.socIn)} → %${Math.round(s.socOut)}`}
                  detail={`${fmt.duration(s.minutes)} · ${fmt.num(s.energyKwh)} kWh · ${fmt.try(s.cost)} · ${s.chargerKw} kW`}
                />
              ))}
              <TimelineItem icon={Zap} last title={`${CITIES.find((c) => c.id === to)?.name} · varış`} meta={`Kalan şarj %${Math.round(plan.arrivalSoc)} · sürüş ${fmt.duration(plan.driveMinutes)} · şarj ${fmt.duration(plan.chargeMinutes)}`} color="#2EE6A6" />
            </ol>
            <div className="mt-2 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                Aynı yolculuk benzinli araçla ≈ <span className="font-semibold text-fg">{fmt.try(plan.iceCost)}</span>
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={onSave} disabled={pending}>
                <Save aria-hidden /> {pending ? 'Kaydediliyor…' : 'Panelime kaydet'}
              </Button>
            </div>
            {saveMsg && (
              <p role="status" className="mt-3 text-sm text-neon">
                {saveMsg} {saveMsg.includes('giriş') && <Link href="/giris?next=/rota" className="underline">Giriş yap</Link>}
              </p>
            )}
          </Card>

          <Card className="p-5 sm:p-6 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold">Şarj seviyesi profili</h2>
                <p className="text-sm text-muted">Mesafe boyunca batarya seviyesi (%). Kesikli çizgi minimum varış şarjı.</p>
              </div>
            </div>
            <div className="mt-4 h-60 w-full">
              <SocChart data={plan.socProfile} arrival={arrival} />
            </div>
            <DataTable caption="Şarj seviyesi profili" columns={['Km', 'Şarj %']} rows={plan.socProfile.map((p) => [fmt.int(p.km), `%${fmt.num(p.soc)}`])} />
          </Card>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ icon: Icon, title, meta, detail, color, last }: { icon: typeof Flag; title: string; meta: string; detail?: string; color: string; last?: boolean }) {
  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 bg-bg" style={{ borderColor: color }}>
          <Icon className="size-4" style={{ color }} aria-hidden />
        </span>
        {!last && <span className="my-1 w-px flex-1 bg-line-strong" />}
      </div>
      <div className={cn('min-w-0 pb-6', last && 'pb-2')}>
        <p className="font-semibold text-fg">{title}</p>
        <p className="tabular text-sm text-muted">{meta}</p>
        {detail && <p className="tabular mt-1 text-xs text-subtle">{detail}</p>}
      </div>
    </li>
  );
}
