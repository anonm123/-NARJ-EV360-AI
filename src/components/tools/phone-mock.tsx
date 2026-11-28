import { Zap, MapPin, Navigation, CreditCard, Bell, Search, BatteryCharging, Route as RouteIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Screen = 'home' | 'map' | 'charge' | 'route';

/** Tamamen CSS ile çizilmiş özgün telefon maketi (mobil uygulama önizlemesi). */
export function PhoneMock({ screen = 'home', className }: { screen?: Screen; className?: string }) {
  return (
    <div className={cn('relative mx-auto aspect-[9/19] w-full max-w-[320px] rounded-[44px] border border-white/10 bg-[linear-gradient(160deg,#1b2635,#070b12)] p-2.5 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.04)]', className)} role="img" aria-label={`NAR-J mobil uygulama önizlemesi: ${LABEL[screen]} ekranı`}>
      <div className="relative h-full overflow-hidden rounded-[36px] bg-bg">
        <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center justify-between px-6 pt-3 text-[10px] font-semibold text-fg/80">
          <span>09:41</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm border border-fg/60" /> 5G
          </span>
        </div>
        <div className="h-[calc(100%-28px)] px-4 pt-6 text-fg">{SCREENS[screen]}</div>
      </div>
    </div>
  );
}

const LABEL: Record<Screen, string> = { home: 'ana', map: 'harita', charge: 'şarj oturumu', route: 'rota' };

const SCREENS: Record<Screen, React.ReactNode> = {
  home: (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-subtle">Günaydın</p>
          <p className="font-display text-base font-semibold">Yolculuğa hazır</p>
        </div>
        <Bell className="size-4 text-muted" />
      </div>
      <div className="mt-4 rounded-3xl border border-line bg-[linear-gradient(140deg,#0e2235,#071321)] p-4">
        <p className="text-[10px] uppercase tracking-widest text-subtle">Togg T10X</p>
        <div className="mt-2 flex items-end justify-between">
          <p className="font-display text-4xl font-semibold">78<span className="text-lg text-muted">%</span></p>
          <p className="text-xs text-muted">≈ 355 km</p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10">
          <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-electric to-neon" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { i: MapPin, t: 'Yakındaki', s: 'istasyonlar' },
          { i: RouteIcon, t: 'Rota', s: 'planla' },
          { i: CreditCard, t: 'NAR-J Pass', s: 'cüzdan' },
          { i: Zap, t: 'Rezervasyon', s: 'yap' },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border border-line bg-surface p-3">
            <x.i className="size-4 text-neon" />
            <p className="mt-2 text-xs font-semibold">{x.t}</p>
            <p className="text-[10px] text-subtle">{x.s}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-neon/30 bg-neon/5 p-3 text-[11px] text-muted">
        <span className="font-semibold text-neon">AI öneri ·</span> Akşam tarifesinde şarj etmek yaklaşık %12 tasarruf sağlayabilir.
      </div>
    </div>
  ),
  map: (
    <div className="relative h-full">
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2.5 text-[11px] text-subtle">
        <Search className="size-3.5" /> İstasyon veya şehir ara
      </div>
      <div className="absolute inset-x-0 bottom-28 top-14 overflow-hidden rounded-3xl border border-line bg-[#07111d]">
        <div className="dot-texture absolute inset-0 opacity-60" />
        <svg viewBox="0 0 200 260" className="absolute inset-0 size-full">
          <path d="M10 200 C 60 180, 80 120, 120 110 S 180 60, 195 20" stroke="#00B8FF" strokeOpacity="0.5" strokeWidth="3" fill="none" />
          <path d="M0 80 C 60 90, 140 150, 200 140" stroke="#9AAFC5" strokeOpacity="0.15" strokeWidth="6" fill="none" />
        </svg>
        {[
          [30, 70, true],
          [55, 40, false],
          [70, 62, true],
          [40, 30, true],
          [80, 25, false],
        ].map(([x, y, a], i) => (
          <span key={i} className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-bg" style={{ left: `${x}%`, top: `${y}%`, background: a ? '#00E5D4' : '#FFB547' }}>
            <Zap className="size-3 text-bg" />
          </span>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-3 rounded-3xl border border-line bg-surface p-3">
        <p className="text-xs font-semibold">Örnek Nokta · 180 kW</p>
        <p className="text-[10px] text-subtle">CCS2 · 2,1 km · 4/6 müsait (demo)</p>
        <div className="mt-2 flex gap-2">
          <span className="flex-1 rounded-full bg-gradient-to-r from-electric to-neon py-1.5 text-center text-[10px] font-bold text-bg">Yol tarifi</span>
          <span className="flex-1 rounded-full border border-line py-1.5 text-center text-[10px] font-semibold">Ayır</span>
        </div>
      </div>
    </div>
  ),
  charge: (
    <div className="flex h-full flex-col items-center text-center">
      <p className="text-[10px] uppercase tracking-widest text-subtle">Şarj oturumu · demo</p>
      <div className="relative mt-6 grid size-44 place-items-center rounded-full">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r="44" stroke="rgba(154,175,197,0.15)" strokeWidth="6" fill="none" />
          <circle cx="50" cy="50" r="44" stroke="url(#pm-g)" strokeWidth="6" fill="none" strokeDasharray="276" strokeDashoffset="88" strokeLinecap="round" />
          <defs>
            <linearGradient id="pm-g">
              <stop offset="0" stopColor="#00B8FF" />
              <stop offset="1" stopColor="#00E5D4" />
            </linearGradient>
          </defs>
        </svg>
        <div>
          <BatteryCharging className="mx-auto size-5 text-neon" />
          <p className="font-display text-4xl font-semibold">68%</p>
          <p className="text-[10px] text-subtle">142 kW</p>
        </div>
      </div>
      <div className="mt-6 grid w-full grid-cols-3 gap-2 text-[10px]">
        {[
          ['Süre', '14 dk'],
          ['Enerji', '28,4 kWh'],
          ['Tutar', '₺395'],
        ].map(([a, b]) => (
          <div key={a} className="rounded-2xl border border-line bg-surface py-2">
            <p className="text-subtle">{a}</p>
            <p className="text-xs font-semibold">{b}</p>
          </div>
        ))}
      </div>
      <span className="mt-auto mb-4 w-full rounded-full border border-danger/40 py-2.5 text-xs font-semibold text-danger">Şarjı durdur</span>
    </div>
  ),
  route: (
    <div className="flex h-full flex-col">
      <p className="font-display text-base font-semibold">İstanbul → Ankara</p>
      <p className="text-[10px] text-subtle">Dengeli mod · tahmini</p>
      <div className="mt-4 space-y-0">
        {[
          ['Başlangıç', '%80', '#00B8FF'],
          ['Şarj · Bolu yakını', '%14 → %58', '#00E5D4'],
          ['Varış', '%18', '#2EE6A6'],
        ].map(([a, b, c], i) => (
          <div key={a} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="size-3 rounded-full" style={{ background: c }} />
              {i < 2 && <span className="w-px flex-1 bg-line-strong" />}
            </div>
            <div className="pb-5">
              <p className="text-xs font-semibold">{a}</p>
              <p className="text-[10px] text-subtle">{b}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto mb-4 rounded-2xl border border-line bg-surface p-3">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Navigation className="size-3.5 text-neon" /> Navigasyonu başlat
        </div>
      </div>
    </div>
  ),
};
