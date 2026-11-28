'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Feature } from 'geojson';
import { AlertTriangle, CheckCircle2, XCircle, ExternalLink, Info, Loader2, LocateFixed, MapPin, Navigation, SlidersHorizontal, X, Zap } from 'lucide-react';
import type { Station } from '@/lib/stations/types';
import { isDc } from '@/lib/stations/normalize';
import { CITIES } from '@/lib/data/cities';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { socketCompat } from '@/lib/compat';
import { usePreferredVehicle } from '@/lib/preferred-vehicle';
import type { ViewBox } from './station-map';
import { markerColor } from './station-map';

const StationMap = dynamic(() => import('./station-map'), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center bg-[radial-gradient(ellipse_at_center,#0c1a2b,#050A12)] text-sm text-muted">
      <span className="flex items-center gap-2"><Zap className="size-4 animate-pulse text-neon" aria-hidden /> Harita yükleniyor…</span>
    </div>
  ),
});

type ProviderMeta = { provider: 'epdk' | 'ocm' | 'osm'; ok: boolean; error?: string; cached?: boolean; count: number };
const PROVIDER_LABEL = { epdk: 'EPDK', ocm: 'Open Charge Map', osm: 'OpenStreetMap' } as const;
const STATUS_TEXT = { operational: 'Çalışıyor (kaynağa göre)', not_operational: 'Çalışmıyor (kaynağa göre)', planned: 'Planlanmış', unknown: 'Durum bilinmiyor' } as const;
const MIN_ZOOM = 9;

export function MapExplorer({ outline }: { outline: Feature }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [providers, setProviders] = useState<ProviderMeta[]>([]);
  const [ocmConfigured, setOcmConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>('Haritayı bir ile yakınlaştırın veya aşağıdan il seçin; görünen bölgedeki gerçek istasyonlar yüklenecek.');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Station | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number; key: number } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [conn, setConn] = useState<string[]>([]);
  const [current, setCurrent] = useState<'all' | 'DC' | 'AC'>('all');
  const [minKw, setMinKw] = useState(0);
  const [q, setQ] = useState('');
  const [source, setSource] = useState<'all' | 'epdk' | 'ocm' | 'osm'>('all');
  const reqId = useRef(0);

  const onView = useCallback(async (v: ViewBox) => {
    if (v.zoom < MIN_ZOOM) {
      setNotice('Bu yakınlıkta tüm Türkiye sorgulanmaz (kaynakların kullanım koşulları gereği). Yakınlaştırın veya il seçin.');
      return;
    }
    setNotice(null);
    // Bölgeyi API sınırına (≤1°) indir: harita merkezine göre kırp
    const cLat = (v.south + v.north) / 2, cLng = (v.west + v.east) / 2;
    const hLat = Math.min((v.north - v.south) / 2, 0.5), hLng = Math.min((v.east - v.west) / 2, 0.7);
    const p = new URLSearchParams({ south: (cLat - hLat).toFixed(4), north: (cLat + hLat).toFixed(4), west: (cLng - hLng).toFixed(4), east: (cLng + hLng).toFixed(4) });
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stations?${p}`);
      const data = await res.json();
      if (id !== reqId.current) return;
      if (!res.ok) {
        setError(data.error ?? 'İstasyonlar alınamadı.');
        return;
      }
      setStations(data.stations);
      setProviders(data.providers);
      setOcmConfigured(data.ocmConfigured);
    } catch {
      if (id === reqId.current) setError('Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLocaleLowerCase('tr');
    return stations
      .filter((s) =>
        (conn.length === 0 || s.connectors.some((c) => conn.includes(c.kind))) &&
        (current === 'all' || (current === 'DC' ? isDc(s) : s.connectors.some((c) => c.current === 'AC'))) &&
        (minKw === 0 || (s.maxPowerKw ?? 0) >= minKw) &&
        (source === 'all' || s.sources.some((x) => x.provider === source)) &&
        (!t || [s.name, s.operator, s.address, s.city].some((x) => x?.toLocaleLowerCase('tr').includes(t))),
      )
      .sort((a, b) => (b.maxPowerKw ?? -1) - (a.maxPowerKw ?? -1));
  }, [stations, conn, current, minKw, source, q]);

  const goCity = (id: string) => {
    const c = CITIES.find((x) => x.id === id);
    if (c) setFlyTarget({ lat: c.lat, lng: c.lng, zoom: 11, key: Date.now() });
  };
  const locate = () => {
    if (!navigator.geolocation) return setError('Tarayıcınız konum özelliğini desteklemiyor.');
    // Konum yalnızca kullanıcı düğmeye bastığında ve izin verdiğinde kullanılır; sunucuya gönderilmez.
    navigator.geolocation.getCurrentPosition(
      (pos) => setFlyTarget({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 12, key: Date.now() }),
      () => setError('Konum izni verilmedi. İl seçerek devam edebilirsiniz.'),
      { timeout: 10_000 },
    );
  };
  const activeCount = conn.length + (current !== 'all' ? 1 : 0) + (minKw ? 1 : 0) + (source !== 'all' ? 1 : 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="order-2 min-w-0 space-y-4 lg:order-1">
        <div className="glass space-y-4 rounded-3xl p-4 sm:p-5">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Select aria-label="İl seç" defaultValue="" onChange={(e) => goCity(e.target.value)}>
              <option value="" disabled>İl seçin (81 il)</option>
              {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={locate} aria-label="Konumuma git (izin ister)" title="Konumuma git">
              <LocateFixed aria-hidden />
            </Button>
          </div>
          <Input aria-label="Ad, operatör veya adres ile ara" placeholder="Ad, operatör veya adres ara" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen} aria-controls="mx-filters">
              {filtersOpen ? <X aria-hidden /> : <SlidersHorizontal aria-hidden />} Filtreler {activeCount > 0 && `(${activeCount})`}
            </Button>
            <span className="text-sm text-muted">{results.length} nokta</span>
          </div>
          <div id="mx-filters" className={cn('space-y-4 lg:block', filtersOpen ? 'block' : 'hidden')}>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-muted">Soket tipi</legend>
              <div className="flex flex-wrap gap-2">
                {['CCS2', 'Type 2', 'CHAdeMO'].map((c) => {
                  const on = conn.includes(c);
                  return (
                    <button key={c} type="button" aria-pressed={on} onClick={() => setConn((x) => (on ? x.filter((y) => y !== c) : [...x, c]))} className={cn('min-h-11 rounded-full border px-4 text-sm font-semibold', on ? 'border-neon/60 bg-neon/10 text-fg' : 'border-line text-muted')}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="mx-cur" className="mb-2 block text-sm font-medium text-muted">Akım</label>
                <Select id="mx-cur" value={current} onChange={(e) => setCurrent(e.target.value as 'all')}>
                  <option value="all">Tümü</option>
                  <option value="DC">DC (hızlı)</option>
                  <option value="AC">AC</option>
                </Select>
              </div>
              <div>
                <label htmlFor="mx-kw" className="mb-2 block text-sm font-medium text-muted">Min. güç</label>
                <Select id="mx-kw" value={minKw} onChange={(e) => setMinKw(Number(e.target.value))}>
                  <option value={0}>Tümü</option>
                  <option value={50}>50 kW+</option>
                  <option value={100}>100 kW+</option>
                  <option value={150}>150 kW+</option>
                </Select>
              </div>
            </div>
            <div>
              <label htmlFor="mx-src" className="mb-2 block text-sm font-medium text-muted">Veri kaynağı</label>
              <Select id="mx-src" value={source} onChange={(e) => setSource(e.target.value as 'all')}>
                <option value="all">Tüm kaynaklar</option>
                <option value="epdk">EPDK (resmî lisans kaydı)</option>
                <option value="ocm">Open Charge Map</option>
                <option value="osm">OpenStreetMap</option>
              </Select>
            </div>
            <p className="text-xs text-subtle">Güç filtresi, gücü bilinmeyen noktaları gizler.</p>
          </div>
        </div>

        <ProviderBanner providers={providers} ocmConfigured={ocmConfigured} />

        <div className="rounded-3xl border border-line bg-surface/60">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-fg" aria-live="polite">
              {loading ? 'Yükleniyor…' : `${results.length} istasyon`}
            </p>
            <StatusBadge status="live" label="Gerçek veri" />
          </div>
          <ul className="max-h-[480px] divide-y divide-line overflow-y-auto overscroll-contain">
            {results.slice(0, 150).map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => setSelected(s)} className={cn('flex min-h-16 w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03]', selected?.id === s.id && 'bg-neon/5')}>
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: markerColor(s) }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">{s.name ?? 'İsimsiz istasyon'}</span>
                    <span className="block truncate text-xs text-muted">{s.operator ?? 'Operatör bilinmiyor'} · {[...new Set(s.connectors.map((c) => c.kind))].join(', ') || 'soket bilinmiyor'}</span>
                    <span className="mt-0.5 block text-[11px] text-subtle">{s.sources.map((x) => PROVIDER_LABEL[x.provider]).join(' + ')}</span>
                  </span>
                  <span className="tabular shrink-0 text-sm font-semibold text-fg">{s.maxPowerKw != null ? `${s.maxPowerKw} kW` : '—'}</span>
                </button>
              </li>
            ))}
            {!loading && results.length === 0 && <li className="p-6 text-center text-sm text-muted">{notice ?? 'Bu bölgede filtrelere uyan istasyon kaydı yok.'}</li>}
          </ul>
        </div>
      </aside>

      <div className="order-1 min-w-0 lg:order-2">
        <div className="relative h-[58svh] min-h-[360px] overflow-hidden rounded-3xl border border-line lg:h-[720px]">
          <StationMap stations={results} outline={outline} selectedId={selected?.id ?? null} onSelect={setSelected} onView={onView} flyTarget={flyTarget} />
          {(loading || notice || error) && (
            <div className="pointer-events-none absolute inset-x-3 top-3 z-[400] flex justify-center">
              <p role={error ? 'alert' : 'status'} className={cn('flex items-center gap-2 rounded-full border px-4 py-2 text-xs backdrop-blur', error ? 'border-danger/40 bg-bg/90 text-danger' : 'border-line bg-bg/85 text-muted')}>
                {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : error ? <AlertTriangle className="size-3.5" aria-hidden /> : <Info className="size-3.5" aria-hidden />}
                {loading ? 'Kaynaklardan istasyonlar alınıyor…' : error ?? notice}
              </p>
            </div>
          )}
          <div className="pointer-events-none absolute bottom-7 left-3 z-[400] flex flex-wrap gap-2 rounded-2xl border border-line bg-bg/85 px-3 py-2 text-[11px] text-muted backdrop-blur">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-neon" />DC</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-electric" />AC</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted" />Soket bilgisi yok</span>
          </div>
        </div>
        {selected && <StationDetail s={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}

function ProviderBanner({ providers, ocmConfigured }: { providers: ProviderMeta[]; ocmConfigured: boolean | null }) {
  if (!providers.length) return null;
  return (
    <div className="space-y-1.5 rounded-2xl border border-line bg-white/[0.02] p-3 text-xs">
      {providers.map((p) => (
        <p key={p.provider} className="flex items-start gap-2 text-muted">
          <span className={cn('mt-1 size-2 shrink-0 rounded-full', p.ok ? 'bg-ok' : 'bg-warn')} aria-hidden />
          <span>
            <strong className="text-fg">{PROVIDER_LABEL[p.provider]}</strong>:{' '}
            {p.ok ? `${p.count} kayıt${p.cached ? ' (önbellek)' : ''}${p.error ? ` · ${p.error}` : ''}` : p.provider === 'ocm' && ocmConfigured === false ? 'API anahtarı tanımlı değil; bu kaynak kullanılmıyor' : `alınamadı (${p.error})`}
          </span>
        </p>
      ))}
    </div>
  );
}

function StationDetail({ s, onClose }: { s: Station; onClose: () => void }) {
  const [vid] = usePreferredVehicle();
  const kinds = [...new Set(s.connectors.map((c) => c.kind))];
  const compat = socketCompat(vid, kinds);
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('tr-TR') : 'bilinmiyor');
  return (
    <section className="glass mt-4 rounded-3xl p-5" aria-label="İstasyon ayrıntıları" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">{s.name ?? 'İsimsiz istasyon'}</h2>
          <p className="text-sm text-muted">{s.operator ?? 'Operatör bilinmiyor'} · {STATUS_TEXT[s.status]}</p>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {[s.address, s.city].filter(Boolean).join(', ') || 'Adres bilinmiyor'}</p>
        </div>
        <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-muted" aria-label="Ayrıntıları kapat"><X className="size-4" aria-hidden /></button>
      </div>
      <p className={cn('mt-4 flex items-start gap-2 rounded-2xl border p-3 text-sm', compat.compatible ? 'border-ok/35 bg-ok/5' : 'border-danger/35 bg-danger/5')}>
        {compat.compatible ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden /> : <XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />}
        <span>
          <strong className="text-fg">{compat.compatible ? `${compat.vehicleName} ile uyumlu` : `${compat.vehicleName} ile uyumlu soket yok`}</strong>
          <span className="block text-xs text-muted">{kinds.length === 0 ? 'Kaynakta soket bilgisi yok.' : compat.compatible ? `Kullanılabilir: ${compat.usable.join(', ')}${compat.fast ? ' · DC hızlı şarj' : ' · yalnızca AC'}` : `İstasyon soketleri: ${kinds.join(', ')}`} · varsayılan aracı <a href="/garaj" className="text-neon underline-offset-2 hover:underline">garajdan</a> değiştirin</span>
        </span>
      </p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[420px] text-left text-sm">
          <caption className="sr-only">Soketler</caption>
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
            <tr><th scope="col" className="px-3 py-2">Soket</th><th scope="col" className="px-3 py-2">Akım</th><th scope="col" className="px-3 py-2">Güç</th><th scope="col" className="px-3 py-2">Adet</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {s.connectors.length === 0 && <tr><td colSpan={4} className="px-3 py-3 text-muted">Kaynakta soket bilgisi yok.</td></tr>}
            {s.connectors.map((c, i) => (
              <tr key={i}><td className="px-3 py-2">{c.label}</td><td className="px-3 py-2 text-muted">{c.current ?? 'bilinmiyor'}</td><td className="tabular px-3 py-2">{c.powerKw != null ? `${c.powerKw} kW` : 'bilinmiyor'}</td><td className="px-3 py-2 text-muted">{c.quantity ?? '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-subtle">Ücret bilgisi (kaynakta yazan)</dt><dd>{s.usageCost ?? 'bilinmiyor'}</dd></div>
        <div><dt className="text-xs text-subtle">Çalışma saatleri</dt><dd>{s.openingHours ?? 'bilinmiyor'}</dd></div>
        <div><dt className="text-xs text-subtle">Hizmet şekli / erişim</dt><dd>{s.access ?? 'bilinmiyor'}</dd></div>
        {s.sources.some((x) => x.provider === 'epdk') && <div><dt className="text-xs text-subtle">EPDK kaydı</dt><dd>Lisanslı şarj ağı işletmecisi listesinde yer alıyor</dd></div>}
        <div><dt className="text-xs text-subtle">Anlık doluluk</dt><dd>Bilinmiyor — açık kaynaklarda canlı doluluk verisi yok</dd></div>
        <div><dt className="text-xs text-subtle">Rezervasyon</dt><dd>Entegrasyon bekleniyor</dd></div>
      </dl>
      {s.conflicts.length > 0 && (
        <p className="mt-4 rounded-xl border border-warn/30 bg-warn/5 p-3 text-xs text-muted"><strong className="text-warn">Kaynaklar arasında farklılık:</strong> {s.conflicts.join(' · ')}</p>
      )}
      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Kaynaklar</p>
        {s.sources.map((x) => (
          <a key={x.provider + x.id} href={x.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-start justify-between gap-3 rounded-xl border border-line px-3 py-2 text-xs hover:border-neon/40">
            <span className="min-w-0">
              <span className="block font-semibold text-fg">{x.attribution}</span>
              <span className="block text-subtle">Lisans: {x.license} · Güncelleme: {fmtDate(x.updatedAt)}</span>
            </span>
            <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
          </a>
        ))}
      </div>
      <a href={`https://www.openstreetmap.org/directions?to=${s.lat}%2C${s.lng}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:border-neon/50">
        <Navigation className="size-4" aria-hidden /> Yol tarifi (OpenStreetMap)
      </a>
    </section>
  );
}
