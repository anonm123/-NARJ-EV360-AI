'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { BatteryFull, Check, ExternalLink, Gauge, Maximize2, Plug, PlugZap, Route, Timer, Wind, X, Zap, Leaf, Info } from 'lucide-react';
import {
  consumptionFor, realRangeFor, SOURCES, SPEC_STATUS_LABEL, SPECS_VERIFIED_AT, TOGG_COLORS, TOGG_VERSIONS,
  type Spec, type SpecStatus, type ToggModel, type ToggVersion,
} from '@/lib/data/togg';
import { toggImage } from '@/lib/data/togg-images';
import { computeCharge } from '@/lib/calc/charging';
import { computeCarbon } from '@/lib/calc/carbon';
import { usePreferredVehicle } from '@/lib/preferred-vehicle';
import { Button } from '@/components/ui/button';
import { cn, fmt } from '@/lib/utils';

const STATUS_CLS: Record<SpecStatus, string> = {
  resmi: 'border-ok/30 bg-ok/8 text-ok',
  'resmi-genel': 'border-ok/25 bg-ok/5 text-ok/90',
  celiskili: 'border-warn/30 bg-warn/8 text-warn',
  'surum-teyitsiz': 'border-warn/25 bg-warn/5 text-warn/90',
  varsayim: 'border-violet/30 bg-violet/10 text-violet',
  tahmini: 'border-neon/30 bg-neon/8 text-neon',
  dogrulanamadi: 'border-line-strong bg-white/3 text-muted',
};

function StatusChip({ s }: { s: SpecStatus }) {
  return <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]', STATUS_CLS[s])}>{SPEC_STATUS_LABEL[s]}</span>;
}

const num = (n: number) => fmt.num(n);

/** Stüdyo sahnesi: lisanslı fotoğraf varsa onu, yoksa (araç çizimi YERİNE) seçili rengin ışığıyla aydınlanan boş sahneyi gösterir. */
function Stage({ v, colorId, large }: { v: ToggVersion; colorId: string; large?: boolean }) {
  const color = TOGG_COLORS[colorId];
  const img = toggImage(v.model, colorId);
  return (
    <div
      className={cn('relative isolate overflow-hidden rounded-[32px] border border-line bg-[#04080f]', large ? 'h-[min(72svh,760px)]' : 'aspect-[4/3] w-full sm:aspect-[16/10]')}
      style={{ ['--glow' as string]: color.glow, ['--paint' as string]: color.swatch }}
    >
      {/* stüdyo tavan ışığı + seçili renge göre dinamik ışık */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-2/3 bg-[radial-gradient(60%_70%_at_50%_0%,rgba(0,229,212,0.20),transparent_70%)]" />
      <div aria-hidden className="absolute left-1/2 top-[38%] -z-10 size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl transition-[background] duration-700" style={{ background: 'radial-gradient(closest-side, var(--glow), transparent)' }} />
      <div aria-hidden className="grid-texture absolute inset-0 -z-10 opacity-30" />
      {/* zemin: yansıtıcı stüdyo platformu */}
      <div aria-hidden className="absolute inset-x-[8%] bottom-[9%] -z-10 h-[22%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.10),transparent)]" />
      <div aria-hidden className="absolute inset-x-[14%] bottom-[12%] -z-10 h-px bg-gradient-to-r from-transparent via-neon/70 to-transparent shadow-[0_0_24px_4px_rgba(0,229,212,0.35)]" />
      <div aria-hidden className="absolute inset-x-[22%] bottom-[10%] -z-10 h-[10%] rounded-[50%] opacity-70 blur-2xl transition-[background] duration-700" style={{ background: 'radial-gradient(closest-side, var(--glow), transparent)' }} />

      {img ? (
        <div className="absolute inset-x-[4%] bottom-[8%] top-[10%]">
          <Image src={img.src} alt={`${v.name} — ${color.name} rengi, ön çapraz görünüm`} fill sizes={large ? '100vw' : '(min-width:1024px) 720px, 100vw'} className="object-contain drop-shadow-[0_40px_40px_rgba(0,0,0,0.7)]" priority={large} />
          <p className="absolute -bottom-6 right-0 text-[10px] text-subtle">© {img.credit} · {img.license}</p>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-10 text-center sm:pt-0">
          <p className="font-display text-[clamp(2.75rem,12vw,8rem)] font-semibold leading-none tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_rgba(245,249,255,0.35)]">{v.model}</p>
          <p className="mt-3 font-display text-lg font-semibold text-fg">{v.version}</p>
          <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted">
            <span className="size-3 rounded-full border border-white/30 transition-colors duration-700" style={{ background: 'var(--paint)' }} aria-hidden />
            {color.name}
          </p>
          <p className="mt-6 max-w-sm rounded-full border border-line bg-bg/70 px-4 py-2 text-[11px] leading-snug text-subtle backdrop-blur">
            Fotogerçekçi Togg görseli, kullanım izni alındığında burada gösterilecek. İzinsiz görsel kullanılmaz.
          </p>
        </div>
      )}
    </div>
  );
}

function SpecRow({ icon: Icon, label, spec, unit, format = num }: { icon: typeof Zap; label: string; spec: Spec<number> | Spec<string>; unit?: string; format?: (n: number) => string }) {
  const v = spec.value;
  const text = v == null ? '—' : typeof v === 'number' ? `${format(v)}${unit ? ` ${unit}` : ''}` : v;
  return (
    <div className="flex min-h-[68px] items-start gap-3 rounded-2xl border border-line bg-bg-2/50 p-3.5" title={spec.note}>
      <Icon className="mt-0.5 size-4 shrink-0 text-neon" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <p className="text-xs text-subtle">{label}</p>
          <StatusChip s={spec.status} />
        </div>
        <p className="tabular mt-1 font-display text-lg font-semibold text-fg">{text}</p>
        {spec.note && <p className="mt-0.5 text-[11px] leading-snug text-subtle">{spec.note}</p>}
      </div>
    </div>
  );
}

export function ToggGarage() {
  const [prefId, setPref] = usePreferredVehicle();
  const [model, setModel] = useState<ToggModel>('T10X');
  const [vid, setVid] = useState(prefId);
  const [colorId, setColorId] = useState('anadolu');
  const [full, setFull] = useState(false);

  // Kayıtlı tercih yüklendiğinde onu göster
  useEffect(() => {
    const p = TOGG_VERSIONS.find((x) => x.id === prefId);
    if (p) {
      setVid(p.id);
      setModel(p.model);
    }
  }, [prefId]);

  const versions = TOGG_VERSIONS.filter((x) => x.model === model);
  const v = TOGG_VERSIONS.find((x) => x.id === vid && x.model === model) ?? versions[0];
  useEffect(() => {
    if (!v.colors.includes(colorId)) setColorId(v.colors[0]);
  }, [v, colorId]);
  const color = TOGG_COLORS[v.colors.includes(colorId) ? colorId : v.colors[0]];

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [full]);

  const est = useMemo(() => {
    const battery = v.specs.batteryKwh.value;
    const cons = consumptionFor(v);
    const real = realRangeFor(v);
    if (battery == null || cons.value == null) return null;
    const dc = computeCharge({ batteryKwh: battery, startSoc: 10, targetSoc: 80, chargerKw: 180, vehicleMaxKw: v.specs.maxDcKw.value ?? 180, type: 'DC', pricePerKwh: 13.9, consumptionKwhPer100: cons.value });
    const ac = computeCharge({ batteryKwh: battery, startSoc: 10, targetSoc: 100, chargerKw: 11, vehicleMaxKw: v.specs.maxAcKw.value ?? 11, type: 'AC', pricePerKwh: 3.2, consumptionKwhPer100: cons.value });
    const carbon = computeCarbon({ kmPerYear: 15000, evKwhPer100: cons.value, iceLitersPer100: 6.8, fuel: 'gasoline' });
    return { cons, real, dc, ac, carbon, per100: (cons.value / 0.92) * 13.9 };
  }, [v]);

  const isDefault = prefId === v.id;
  const sources = [...new Set(Object.values(v.specs).map((s) => s.source).filter(Boolean))] as (keyof typeof SOURCES)[];

  return (
    <div className="space-y-6">
      {/* Model ve sürüm seçimi */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-line bg-bg-2 p-1" role="tablist" aria-label="Model">
          {(['T10X', 'T10F'] as ToggModel[]).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={model === m} onClick={() => { setModel(m); setVid(TOGG_VERSIONS.find((x) => x.model === m)!.id); }} className={cn('min-h-11 rounded-full px-6 font-display text-sm font-semibold tracking-wide transition-colors', model === m ? 'bg-[linear-gradient(110deg,rgba(0,184,255,0.25),rgba(0,229,212,0.25))] text-fg shadow-[0_0_24px_-6px_rgba(0,229,212,0.6)]' : 'text-muted hover:text-fg')}>
              Togg {m}
            </button>
          ))}
        </div>
        <span className="text-xs text-subtle">{model === 'T10X' ? 'C-SUV' : 'Fastback'} · {versions.length} sürüm · resmî fiyat listesindeki sürümler</span>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Sürüm">
        {versions.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={x.id === v.id} onClick={() => setVid(x.id)} className={cn('min-h-14 shrink-0 rounded-2xl border px-4 py-2 text-left transition-all duration-300', x.id === v.id ? 'border-neon/60 bg-neon/8 shadow-[0_0_0_4px_rgba(0,229,212,0.08)]' : 'border-line hover:border-line-strong')}>
            <span className="block text-sm font-semibold text-fg">{x.version}</span>
            <span className="block text-[11px] text-subtle">{x.driveLabel}{prefId === x.id ? ' · varsayılan' : ''}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Sahne */}
        <div className="min-w-0 space-y-4">
          <div className="relative">
            <Stage v={v} colorId={color.id} />
            <button type="button" onClick={() => setFull(true)} className="glass absolute right-4 top-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-fg" aria-label="Tam ekran incele">
              <Maximize2 className="size-4" aria-hidden /> Tam ekran
            </button>
          </div>
          {/* Renkler */}
          <div className="glass rounded-3xl p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-fg">Renk · <span className="text-neon">{color.name}</span></p>
              <StatusChip s={v.colorsStatus} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3" role="radiogroup" aria-label="Renk seçimi">
              {v.colors.map((c) => {
                const col = TOGG_COLORS[c];
                const on = c === color.id;
                return (
                  <button key={c} type="button" role="radio" aria-checked={on} aria-label={col.name} onClick={() => setColorId(c)} className={cn('group grid size-12 place-items-center rounded-full border transition-all duration-300', on ? 'border-neon shadow-[0_0_20px_-2px_rgba(0,229,212,0.7)]' : 'border-line hover:border-line-strong')}>
                    <span className="size-9 rounded-full shadow-[inset_0_-6px_10px_rgba(0,0,0,0.45),inset_0_6px_10px_rgba(255,255,255,0.25)]" style={{ background: `radial-gradient(circle at 32% 28%, ${col.glow}, ${col.swatch} 58%, #000 140%)` }} />
                  </button>
                );
              })}
            </div>
            {color.story && <p className="mt-3 text-sm text-muted">{color.story}</p>}
            <p className="mt-2 text-[11px] leading-snug text-subtle">{v.colorsNote} Renk örnekleri temsilî tondur; Togg resmî renk kodu yayımlamamaktadır.</p>
          </div>
        </div>

        {/* Başlık + teknik veriler */}
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neon">{v.body} · {v.driveLabel}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">{v.name}</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => setPref(v.id)} disabled={isDefault} variant={isDefault ? 'secondary' : 'primary'}>
                {isDefault ? <><Check aria-hidden /> Varsayılan aracım</> : 'Varsayılan aracım yap'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-subtle">Varsayılan araç bu tarayıcıda saklanır; maliyet hesaplayıcı, rota planlayıcı, hızlı hesap ve karbon analitiği onunla açılır.</p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <SpecRow icon={BatteryFull} label="Batarya kapasitesi" spec={v.specs.batteryKwh} unit="kWh" />
            <SpecRow icon={Route} label="WLTP menzili" spec={v.specs.wltpRangeKm} unit="km" format={fmt.int} />
            <SpecRow icon={Gauge} label="Enerji tüketimi" spec={v.specs.consumptionKwhPer100} unit="kWh/100 km" />
            <SpecRow icon={Zap} label="Maks. DC şarj gücü" spec={v.specs.maxDcKw} unit="kW" format={fmt.int} />
            <SpecRow icon={PlugZap} label="AC şarj gücü" spec={v.specs.maxAcKw} unit="kW" format={fmt.int} />
            <SpecRow icon={Timer} label="DC hızlı şarj %20→%80" spec={v.specs.dcCharge20to80Min} unit="dk" />
            <SpecRow icon={Zap} label="Motor gücü" spec={v.specs.powerKw} unit={v.specs.powerPs.value ? `kW · ${v.specs.powerPs.value} PS` : 'kW'} format={fmt.int} />
            <SpecRow icon={Wind} label="0-100 km/s" spec={v.specs.accel0to100s} unit="sn" />
            <SpecRow icon={Gauge} label="Tork" spec={v.specs.torqueNm} unit="Nm" format={fmt.int} />
            <SpecRow icon={Plug} label="Şarj soketi" spec={v.specs.sockets} />
          </div>
        </div>
      </div>

      {/* NAR-J tahminleri — resmî verilerden ayrı */}
      {est && (
        <div className="rounded-3xl border border-neon/20 bg-[linear-gradient(160deg,rgba(0,229,212,0.06),rgba(7,14,25,0.9))] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl font-semibold">NAR-J hesaplamaları</h3>
            <StatusChip s="tahmini" />
          </div>
          <p className="mt-1 text-sm text-muted">Resmî Togg verisi değildir; NAR-J hesap motorlarıyla yukarıdaki değerlerden hesaplanır.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              { l: 'Gerçek kullanım menzili', v: est.real.value != null ? `${fmt.int(est.real.value)} km` : '—', n: est.real.note },
              { l: 'Hesapta tüketim', v: `${num(est.cons.value!)} kWh/100 km`, n: est.cons.status === 'tahmini' ? est.cons.note : 'Resmî değer' },
              { l: 'DC %10→%80 (180 kW)', v: fmt.duration(est.dc.minutes), n: 'Genel DC şarj eğrisiyle' },
              { l: 'AC %10→%100 (11 kW)', v: fmt.duration(est.ac.minutes), n: 'Wallbox, %90 verim' },
              { l: '100 km maliyeti', v: fmt.try(est.per100), n: '13,90 ₺/kWh örnek DC tarife' },
              { l: 'Yıllık CO₂ tasarrufu', v: `${fmt.num(est.carbon.savedKg / 1000)} ton`, n: '15.000 km, benzinliye göre' },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl border border-line bg-bg-2/60 p-3.5">
                <p className="text-xs text-subtle">{x.l}</p>
                <p className="tabular mt-1 font-display text-lg font-semibold text-fg">{x.v}</p>
                {x.n && <p className="mt-0.5 text-[11px] leading-snug text-subtle">{x.n}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kaynaklar */}
      <div className="rounded-3xl border border-line bg-white/[0.015] p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-fg"><Info className="size-4 text-neon" aria-hidden /> Veri kaynakları ({new Date(SPECS_VERIFIED_AT).toLocaleDateString('tr-TR')} tarihinde kontrol edildi)</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {[...sources, v.listedIn].filter((s, i, a) => a.indexOf(s) === i).map((k) => (
            <li key={k}>
              <a href={SOURCES[k].url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs text-muted hover:border-neon/40 hover:text-fg">
                {SOURCES[k].label} <ExternalLink className="size-3" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-subtle">Togg değerleri zamanla güncelleyebilir; satın alma kararından önce Togg konfigüratörünü kontrol edin. “Doğrulanamadı” olan alanlar resmî kaynakta bulunamamıştır ve uydurulmamıştır.</p>
      </div>

      {/* Tam ekran inceleme */}
      {full && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-bg/95 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={`${v.name} tam ekran inceleme`}>
          <div className="shell flex items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-semibold">{v.name}</p>
              <p className="text-xs text-muted">{color.name} · {v.driveLabel}</p>
            </div>
            <button type="button" onClick={() => setFull(false)} className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg" aria-label="Kapat"><X className="size-5" aria-hidden /></button>
          </div>
          <div className="shell flex-1 pb-4"><Stage v={v} colorId={color.id} large /></div>
          <div className="shell flex flex-wrap items-center gap-3 pb-6">
            {v.colors.map((c) => (
              <button key={c} type="button" onClick={() => setColorId(c)} aria-label={TOGG_COLORS[c].name} aria-pressed={c === color.id} className={cn('size-10 rounded-full border-2 transition-all', c === color.id ? 'border-neon' : 'border-transparent')} style={{ background: `radial-gradient(circle at 32% 28%, ${TOGG_COLORS[c].glow}, ${TOGG_COLORS[c].swatch} 58%, #000 140%)` }} />
            ))}
            <span className="ml-auto text-xs text-subtle"><Leaf className="mr-1 inline size-3.5 text-neon" aria-hidden />{v.specs.wltpRangeKm.value ? `${fmt.int(v.specs.wltpRangeKm.value)} km WLTP` : 'WLTP menzili doğrulanamadı'} · {v.specs.batteryKwh.value} kWh</span>
          </div>
        </div>
      )}
    </div>
  );
}
