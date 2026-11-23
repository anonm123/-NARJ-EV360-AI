'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { AlertTriangle, ArrowLeftRight, BatteryCharging, Clock3, ExternalLink, Flag, Loader2, MapPin, Route as RouteIcon, Save, Wallet, Zap } from 'lucide-react';
import { CITIES } from '@/lib/data/cities';
import { VEHICLE_PROFILES } from '@/lib/data/vehicles';
import { planTrip, TripError, type FoundStation, type TripPlan } from '@/lib/calc/trip';
import { cumulativeKm, pointAtKm, projectOnRoute, type LngLat } from '@/lib/routing/geometry';
import { isDc } from '@/lib/stations/normalize';
import type { Station } from '@/lib/stations/types';
import { saveRouteAction } from '@/app/actions/panel';
import { Card } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { RangeField } from '@/components/ui/range-field';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable } from '@/components/charts/chart-tooltip';
import { cn, fmt } from '@/lib/utils';

const SocChart = dynamic(() => import('@/components/charts/soc-chart'), { ssr: false, loading: () => <div className="size-full animate-pulse rounded-2xl bg-white/[0.03]" /> });
const RouteMap = dynamic(() => import('@/components/map/route-map'), { ssr: false, loading: () => <div className="size-full animate-pulse bg-white/[0.03]" /> });

interface RoadRoute { distanceKm: number; durationMin: number; geometry: LngLat[]; engine: string; demoServer: boolean }
interface Result { route: RoadRoute; plan: TripPlan | null; planError: string | null; stationCount: number; sourceErrors: string[] }

const OFF_ROUTE_KM = 5;

export function RoutePlanner() {
  const [from, setFrom] = useState('istanbul');
  const [to, setTo] = useState('ankara');
  const [via, setVia] = useState('');
  const [vid, setVid] = useState('kompakt-suv');
  const preset = VEHICLE_PROFILES.find((v) => v.id === vid)!;
  const [battery, setBattery] = useState(preset.batteryKwh);
  const [cons, setCons] = useState(preset.consumptionKwhPer100);
  const [maxDc, setMaxDc] = useState(preset.maxDcKw);
  const [startSoc, setStartSoc] = useState(80);
  const [reserve, setReserve] = useState(12);
  const [target, setTarget] = useState(80);
  const [useTemp, setUseTemp] = useState(false);
  const [temp, setTemp] = useState(15);
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const stationCache = useRef(new Map<string, Station[]>());

  const pickVehicle = (id: string) => {
    const v = VEHICLE_PROFILES.find((x) => x.id === id)!;
    setVid(id); setBattery(v.batteryKwh); setCons(v.consumptionKwhPer100); setMaxDc(v.maxDcKw);
  };
  const city = (id: string) => CITIES.find((c) => c.id === id)!;

  async function stationsAround(p: LngLat, errors: Set<string>): Promise<Station[]> {
    const [lng, lat] = p;
    const q = new URLSearchParams({ south: (lat - 0.2).toFixed(3), north: (lat + 0.2).toFixed(3), west: (lng - 0.26).toFixed(3), east: (lng + 0.26).toFixed(3) });
    const k = q.toString();
    if (stationCache.current.has(k)) return stationCache.current.get(k)!;
    const res = await fetch(`/api/stations?${q}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'İstasyonlar alınamadı');
    for (const pr of data.providers as { provider: string; ok: boolean; error?: string }[]) if (!pr.ok && pr.error) errors.add(`${pr.provider === 'ocm' ? 'Open Charge Map' : pr.provider === 'epdk' ? 'EPDK' : 'OpenStreetMap'}: ${pr.error}`);
    stationCache.current.set(k, data.stations);
    return data.stations;
  }

  async function calculate() {
    if (from === to) return setError('Başlangıç ve varış farklı olmalı.');
    setBusy(true); setError(null); setResult(null); setSaveMsg(null);
    try {
      const a = city(from), b = city(to), v = via ? city(via) : null;
      const qs = new URLSearchParams({ from: `${a.lng},${a.lat}`, to: `${b.lng},${b.lat}` });
      if (v) qs.set('via', `${v.lng},${v.lat}`);
      const r = await fetch(`/api/route?${qs}`);
      const route = await r.json();
      if (!r.ok) throw new Error(route.error ?? 'Rota hesaplanamadı.');
      const cum = cumulativeKm(route.geometry, route.distanceKm);
      const errors = new Set<string>();
      const seen = new Map<string, Station>();
      const finder = async (minKm: number, maxKm: number): Promise<FoundStation | null> => {
        // Menzilin sonundan geriye doğru 25 km aralıklarla gerçek DC istasyon aranır
        for (let km = maxKm; km >= minKm; km -= 25) {
          const list = await stationsAround(pointAtKm(route.geometry, cum, km), errors);
          let best: FoundStation | null = null;
          for (const s of list) {
            if (!isDc(s) || s.status === 'not_operational' || s.status === 'planned') continue;
            seen.set(s.id, s);
            const pr = projectOnRoute(route.geometry, cum, [s.lng, s.lat]);
            if (pr.offKm > OFF_ROUTE_KM || pr.km < minKm || pr.km > maxKm) continue;
            const cand = { id: s.id, name: s.name, km: pr.km, offRouteKm: pr.offKm, maxPowerKw: s.maxPowerKw, lat: s.lat, lng: s.lng };
            if (!best || cand.km > best.km + 3 || (Math.abs(cand.km - best.km) <= 3 && (cand.maxPowerKw ?? 0) > (best.maxPowerKw ?? 0))) best = cand;
          }
          if (best) return best;
        }
        return null;
      };
      let plan: TripPlan | null = null;
      let planError: string | null = null;
      try {
        plan = await planTrip(
          {
            distanceKm: route.distanceKm,
            durationMin: route.durationMin,
            vehicle: { batteryKwh: battery, consumptionKwhPer100: cons, maxDcKw: maxDc },
            startSoc, reserveSoc: reserve, targetSoc: target,
            tempC: useTemp ? temp : null,
            pricePerKwh: price.trim() ? Number(price.replace(',', '.')) : null,
          },
          finder,
        );
      } catch (e) {
        planError = e instanceof TripError ? e.message : 'Şarj planı oluşturulamadı.';
      }
      setResult({ route, plan, planError, stationCount: seen.size, sourceErrors: [...errors] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const onSave = () => {
    if (!result?.plan) return;
    const p = result.plan;
    start(async () => {
      const r = await saveRouteAction({ fromId: from, toId: to, distanceKm: p.distanceKm, totalMinutes: p.totalMinutes, totalCost: p.totalCost ?? 0, stops: p.stops.length });
      setSaveMsg(r.message ?? null);
    });
  };

  const plan = result?.plan;
  return (
    <div className="space-y-6">
      <Card variant="glass" className="p-5 sm:p-7">
        <form onSubmit={(e) => { e.preventDefault(); calculate(); }}>
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-end">
            <Field label="Başlangıç (il merkezi)" htmlFor="rp-from">
              <Select id="rp-from" value={from} onChange={(e) => setFrom(e.target.value)}>{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            </Field>
            <Button type="button" variant="outline" size="icon" className="mx-auto rotate-90 md:rotate-0" onClick={() => { setFrom(to); setTo(from); }} aria-label="Başlangıç ve varışı değiştir"><ArrowLeftRight aria-hidden /></Button>
            <Field label="Varış (il merkezi)" htmlFor="rp-to">
              <Select id="rp-to" value={to} onChange={(e) => setTo(e.target.value)}>{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            </Field>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Ara durak (isteğe bağlı)" htmlFor="rp-via">
              <Select id="rp-via" value={via} onChange={(e) => setVia(e.target.value)}><option value="">Yok</option>{CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            </Field>
            <Field label="Araç şablonu" htmlFor="rp-v">
              <Select id="rp-v" value={vid} onChange={(e) => pickVehicle(e.target.value)}>{VEHICLE_PROFILES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select>
            </Field>
            <Field label="Kullanılabilir batarya (kWh)" htmlFor="rp-b"><Input id="rp-b" type="number" inputMode="decimal" min={10} max={250} value={battery} onChange={(e) => setBattery(Math.max(10, Number(e.target.value) || 10))} /></Field>
            <Field label="Tüketim (kWh/100 km)" htmlFor="rp-c"><Input id="rp-c" type="number" inputMode="decimal" step={0.1} min={8} max={45} value={cons} onChange={(e) => setCons(Math.max(8, Number(e.target.value) || 8))} /></Field>
            <Field label="Maks. DC şarj gücü (kW)" htmlFor="rp-dc"><Input id="rp-dc" type="number" inputMode="numeric" min={20} max={400} value={maxDc} onChange={(e) => setMaxDc(Math.max(20, Number(e.target.value) || 20))} /></Field>
            <RangeField label="Başlangıç şarjı" value={startSoc} min={20} max={100} onChange={setStartSoc} format={(n) => `%${n}`} />
            <RangeField label="Güvenlik rezervi" value={reserve} min={5} max={30} onChange={setReserve} format={(n) => `%${n}`} />
            <RangeField label="Duraklarda hedef şarj" value={target} min={50} max={100} step={5} onChange={setTarget} format={(n) => `%${n}`} />
            <div>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted">
                <input type="checkbox" checked={useTemp} onChange={(e) => setUseTemp(e.target.checked)} className="size-5 accent-[#00E5D4]" /> Dış sıcaklığı biliyorum
              </label>
              {useTemp && <RangeField label="Dış sıcaklık" value={temp} min={-20} max={45} onChange={setTemp} format={(n) => `${n}°C`} />}
            </div>
            <Field label="DC birim fiyat ₺/kWh (isteğe bağlı)" htmlFor="rp-price" hint="Kendi operatörünüzün tarifesi; girilmezse maliyet hesaplanmaz.">
              <Input id="rp-price" inputMode="decimal" placeholder="örn. 13,90" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <RouteIcon aria-hidden />} {busy ? 'Rota ve istasyonlar alınıyor…' : 'Rotayı hesapla'}
            </Button>
            <span className="text-xs text-subtle">Karayolu rotası: OSRM · İstasyonlar: EPDK + Open Charge Map + OpenStreetMap</span>
          </div>
        </form>
      </Card>

      {error && <Card className="flex items-start gap-3 border-danger/40 p-5 text-danger" role="alert"><AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />{error}</Card>}

      {result && (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <Card variant="feature" className="overflow-hidden p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="font-display text-lg font-semibold">{city(from).name} → {city(to).name}</h2>
              <StatusBadge status="live" label="Gerçek karayolu" />
            </div>
            <div className="mt-4 h-[380px] overflow-hidden rounded-2xl border border-line sm:h-[440px]">
              <RouteMap coords={result.route.geometry} stops={(plan?.stops ?? []).map((s) => ({ lat: s.station.lat, lng: s.station.lng, label: s.station.name ?? 'İsimsiz istasyon' }))} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { i: MapPin, l: 'Yol mesafesi', v: `${fmt.int(result.route.distanceKm)} km` },
                { i: Clock3, l: 'Sürüş (routing)', v: fmt.duration(result.route.durationMin) },
                { i: Zap, l: 'Enerji', v: plan ? `${fmt.num(plan.energyKwh)} kWh` : '—' },
                { i: Wallet, l: 'Şarj maliyeti', v: plan?.totalCost != null ? fmt.try(plan.totalCost) : 'fiyat girilmedi' },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-line bg-bg-2/60 p-3.5">
                  <s.i className="size-4 text-neon" aria-hidden />
                  <p className="mt-2 text-xs text-muted">{s.l}</p>
                  <p className="tabular font-display text-lg font-semibold">{s.v}</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-1 px-1 text-xs text-subtle">
              <li>Rota motoru: {result.route.engine}{result.route.demoServer ? ' (herkese açık demo sunucusu — üretim için kendi sunucusu gerekir)' : ''}.</li>
              {plan && <li>Kullanılan tüketim: {fmt.num(plan.consumptionKwhPer100)} kWh/100 km — {plan.corrections.join(' · ')}.</li>}
              <li>Rota boyunca incelenen DC istasyon: {result.stationCount}.</li>
              {result.sourceErrors.map((e) => <li key={e} className="text-warn">Kaynak uyarısı: {e}</li>)}
            </ul>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">Şarj planı</h2>
            {result.planError ? (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-warn/30 bg-warn/5 p-4 text-sm text-muted"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />{result.planError}</p>
            ) : plan && (
              <>
                <ol className="mt-5">
                  <Step icon={Flag} color="#00B8FF" title={`${city(from).name} · çıkış`} meta={`Şarj %${startSoc}`} />
                  {plan.stops.map((s, i) => (
                    <Step key={i} icon={BatteryCharging} color="#00E5D4"
                      title={`${i + 1}. ${s.station.name ?? 'İsimsiz istasyon'}`}
                      meta={`${fmt.int(s.station.km)}. km · rotadan ${fmt.num(s.station.offRouteKm)} km · %${Math.round(s.arriveSoc)} → %${Math.round(s.departSoc)}`}
                      detail={`${s.station.maxPowerKw != null ? `${s.station.maxPowerKw} kW` : 'güç bilinmiyor (50 kW varsayıldı)'} · ~${fmt.duration(s.chargeMinutes)} · ${fmt.num(s.energyKwh)} kWh${s.cost != null ? ` · ${fmt.try(s.cost)}` : ''}`}
                      href={s.station.id.startsWith('ocm:') ? `https://openchargemap.org/site/poi/details/${s.station.id.slice(4)}` : `https://www.openstreetmap.org/${s.station.id.slice(4)}`} />
                  ))}
                  <Step icon={Zap} last color="#2EE6A6" title={`${city(to).name} · varış`} meta={`Kalan şarj %${Math.round(plan.arrivalSoc)} · toplam ${fmt.duration(plan.totalMinutes)} (şarj ${fmt.duration(plan.chargeMinutes)})`} />
                </ol>
                <p className="text-xs text-subtle">Şarj süreleri genel DC şarj eğrisiyle <strong>tahminidir</strong>. İstasyon doluluğu bilinmiyor; yola çıkmadan operatörden kontrol edin.</p>
                <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-subtle">Kaydedince panelinizde görünür.</span>
                  <Button type="button" variant="secondary" size="sm" onClick={onSave} disabled={pending}><Save aria-hidden /> {pending ? 'Kaydediliyor…' : 'Panelime kaydet'}</Button>
                </div>
                {saveMsg && <p role="status" className="mt-3 text-sm text-neon">{saveMsg} {saveMsg.includes('giriş') && <Link href="/giris?next=/rota" className="underline">Giriş yap</Link>}</p>}
              </>
            )}
          </Card>

          {plan && (
            <Card className="p-5 sm:p-6 xl:col-span-2">
              <h2 className="font-display text-lg font-semibold">Şarj seviyesi profili</h2>
              <p className="text-sm text-muted">Gerçek yol mesafesi boyunca batarya seviyesi (%). Kesikli çizgi güvenlik rezervi.</p>
              <div className="mt-4 h-60 w-full"><SocChart data={plan.socProfile} arrival={reserve} /></div>
              <DataTable caption="Şarj seviyesi profili" columns={['Km', 'Şarj %']} rows={plan.socProfile.map((p) => [fmt.int(p.km), `%${fmt.num(p.soc)}`])} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Step({ icon: Icon, title, meta, detail, color, last, href }: { icon: typeof Flag; title: string; meta: string; detail?: string; color: string; last?: boolean; href?: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 bg-bg" style={{ borderColor: color }}><Icon className="size-4" style={{ color }} aria-hidden /></span>
        {!last && <span className="my-1 w-px flex-1 bg-line-strong" />}
      </div>
      <div className={cn('min-w-0 pb-6', last && 'pb-3')}>
        <p className="font-semibold text-fg">{title}</p>
        <p className="tabular text-sm text-muted">{meta}</p>
        {detail && <p className="tabular mt-1 text-xs text-subtle">{detail}</p>}
        {href && <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-9 items-center gap-1 text-xs text-neon hover:underline">Kaynak kaydı <ExternalLink className="size-3" aria-hidden /></a>}
      </div>
    </li>
  );
}
