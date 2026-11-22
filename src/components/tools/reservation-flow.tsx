'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, CreditCard, Lock, MapPin, Zap, CalendarCheck2 } from 'lucide-react';
import { SAMPLE_STATIONS, STATUS_LABEL } from '@/lib/data/stations';
import { CITIES } from '@/lib/data/cities';
import { createReservationAction, type ReservationState } from '@/app/actions/panel';
import { Card } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn, fmt } from '@/lib/utils';

const STEPS = ['İstasyon', 'Zaman', 'Ödeme', 'Onay'];
const SLOTS = Array.from({ length: 16 }, (_, i) => `${String(7 + i).padStart(2, '0')}:00`);

function localDate(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function ReservationFlow({ initialStation }: { initialStation?: string }) {
  const reduce = useReducedMotion();
  const init = SAMPLE_STATIONS.find((s) => s.id === initialStation);
  const [step, setStep] = useState(0);
  const [city, setCity] = useState(init?.cityId ?? 'istanbul');
  const [stationId, setStationId] = useState(init?.id ?? '');
  const [date, setDate] = useState(iso(localDate(1)));
  const [slot, setSlot] = useState('');
  const [duration, setDuration] = useState(45);
  const [card, setCard] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [state, action, pending] = useActionState<ReservationState, FormData>(createReservationAction, {});

  const stations = useMemo(() => SAMPLE_STATIONS.filter((s) => s.cityId === city && s.demoStatus !== 'offline'), [city]);
  const station = SAMPLE_STATIONS.find((s) => s.id === stationId);
  const estimate = station ? Math.round(((station.maxKw * 0.7 * duration) / 60) * station.pricePerKwh) : 0;
  const busy = useMemo(() => new Set(SLOTS.filter((_, i) => (i * 7 + (stationId.length ?? 0) + Number(date.slice(-2))) % 5 === 0)), [stationId, date]);
  const current = state.ok ? 3 : step;
  const e = state.errors ?? {};

  const canNext = (step === 0 && !!station) || (step === 1 && !!slot);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card variant="feature" className="overflow-hidden p-5 sm:p-8">
        <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Adımlar">
          {STEPS.map((s, i) => (
            <li key={s} className="min-w-0" aria-current={i === current ? 'step' : undefined}>
              <div className={cn('h-1 rounded-full transition-colors duration-500', i <= current ? 'bg-gradient-to-r from-electric to-neon' : 'bg-white/10')} />
              <p className={cn('mt-2 truncate text-xs font-semibold', i <= current ? 'text-fg' : 'text-subtle')}>
                <span className="tabular">{i + 1}.</span> {s}
              </p>
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div key={current} initial={reduce ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            {current === 0 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-semibold">Şarj noktası seçin</h2>
                <Field label="Şehir" htmlFor="rs-city">
                  <Select id="rs-city" value={city} onChange={(ev) => { setCity(ev.target.value); setStationId(''); }}>
                    {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="İstasyonlar">
                  {stations.map((s) => (
                    <button key={s.id} type="button" role="radio" aria-checked={stationId === s.id} onClick={() => setStationId(s.id)} className={cn('flex min-h-20 flex-col items-start rounded-2xl border p-4 text-left transition-all', stationId === s.id ? 'border-neon/60 bg-neon/8 shadow-[0_0_0_4px_rgba(0,229,212,0.08)]' : 'border-line hover:border-line-strong')}>
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="truncate font-semibold">{s.name}</span>
                        <span className="tabular shrink-0 text-sm font-semibold text-neon">{s.maxKw} kW</span>
                      </span>
                      <span className="mt-1 text-xs text-muted">{s.operator} · {s.site} · {s.connectors.join(', ')}</span>
                      <span className="mt-1 text-xs text-subtle">{STATUS_LABEL[s.demoStatus]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {current === 1 && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold">Tarih ve saat</h2>
                <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Tarih">
                  {Array.from({ length: 7 }, (_, i) => localDate(i)).map((d) => {
                    const v = iso(d);
                    return (
                      <button key={v} type="button" role="radio" aria-checked={date === v} onClick={() => { setDate(v); setSlot(''); }} className={cn('flex min-h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border', date === v ? 'border-neon/60 bg-neon/10' : 'border-line')}>
                        <span className="text-[11px] uppercase text-subtle">{d.toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
                        <span className="tabular font-display text-lg font-semibold">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-2 min-[480px]:grid-cols-4" role="radiogroup" aria-label="Saat">
                  {SLOTS.map((s) => {
                    const dis = busy.has(s);
                    return (
                      <button key={s} type="button" role="radio" aria-checked={slot === s} disabled={dis} onClick={() => setSlot(s)} className={cn('tabular min-h-11 rounded-xl border text-sm font-semibold transition-colors', slot === s ? 'border-neon/60 bg-neon/10 text-fg' : 'border-line text-muted hover:text-fg', dis && 'cursor-not-allowed line-through opacity-35')}>
                        {s}
                      </button>
                    );
                  })}
                </div>
                <Field label="Süre" htmlFor="rs-dur">
                  <Select id="rs-dur" value={duration} onChange={(ev) => setDuration(Number(ev.target.value))}>
                    {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} dakika</option>)}
                  </Select>
                </Field>
              </div>
            )}
            {current === 2 && (
              <form action={action} className="space-y-5" noValidate>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold">Ödeme</h2>
                  <StatusBadge status="demo" label="Test modu" />
                </div>
                <p className="rounded-2xl border border-electric/30 bg-electric/5 p-4 text-sm text-muted">
                  Gerçek ödeme alınmaz ve kart bilgileri saklanmaz. Test kartı: <span className="tabular font-semibold text-fg">4242 4242 4242 4242</span>, gelecekteki herhangi bir tarih ve herhangi bir CVC.
                </p>
                <input type="hidden" name="stationId" value={stationId} />
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="slot" value={slot} />
                <input type="hidden" name="durationMin" value={duration} />
                <Field label="Kart numarası" htmlFor="rs-card" error={e.cardNumber}>
                  <Input id="rs-card" name="cardNumber" inputMode="numeric" autoComplete="cc-number" value={card} onChange={(ev) => setCard(ev.target.value.replace(/[^\d]/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '))} placeholder="0000 0000 0000 0000" aria-invalid={!!e.cardNumber} />
                </Field>
                <Field label="Kart üzerindeki ad" htmlFor="rs-name" error={e.cardName}>
                  <Input id="rs-name" name="cardName" autoComplete="cc-name" value={cardName} onChange={(ev) => setCardName(ev.target.value)} aria-invalid={!!e.cardName} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Son kullanma (AA/YY)" htmlFor="rs-exp" error={e.expiry}>
                    <Input id="rs-exp" name="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="12/29" maxLength={5} value={expiry} onChange={(ev) => { const d = ev.target.value.replace(/\D/g, '').slice(0, 4); setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d); }} aria-invalid={!!e.expiry} />
                  </Field>
                  <Field label="CVC" htmlFor="rs-cvc" error={e.cvc}>
                    <Input id="rs-cvc" name="cvc" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={cvc} onChange={(ev) => setCvc(ev.target.value.replace(/\D/g, '').slice(0, 4))} aria-invalid={!!e.cvc} />
                  </Field>
                </div>
                {(state.message || e.date || e.stationId) && <p role="alert" className="text-sm text-danger">{state.message ?? e.date ?? 'Seçimleri kontrol edin.'}</p>}
                <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
                  <Lock aria-hidden /> {pending ? 'İşleniyor…' : `${fmt.try(estimate)} · Demo ödemeyi onayla`}
                </Button>
              </form>
            )}
            {current === 3 && state.reservation && (
              <div className="flex flex-col items-center py-6 text-center" role="status">
                <motion.span initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="grid size-20 place-items-center rounded-full bg-[linear-gradient(135deg,#00B8FF,#00E5D4)] text-bg">
                  <Check className="size-10" aria-hidden />
                </motion.span>
                <h2 className="mt-6 font-display text-2xl font-semibold">Rezervasyon onaylandı</h2>
                <p className="mt-2 text-muted">{state.reservation.stationName} · {new Date(state.reservation.date + 'T00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} {state.reservation.slot} · {state.reservation.durationMin} dk</p>
                <p className="tabular mt-4 rounded-full border border-line px-4 py-2 text-sm">Referans: <span className="font-semibold text-neon">{state.reservation.paymentRef}</span></p>
                <p className="mt-4 max-w-sm text-xs text-subtle">Bu bir demo rezervasyondur; istasyonda gerçek bir yer ayrılmamıştır. Giriş yaptıysanız panelinizdeki “Rezervasyonlar” bölümünde görünür.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button asChild variant="secondary"><Link href="/panel/rezervasyonlar" prefetch={false}>Rezervasyonlarım</Link></Button>
                  <Button asChild variant="ghost"><Link href="/harita">Haritaya dön</Link></Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {current < 2 && (
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
            <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft aria-hidden /> Geri
            </Button>
            <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Devam <ChevronRight aria-hidden />
            </Button>
          </div>
        )}
        {current === 2 && !state.ok && (
          <Button type="button" variant="ghost" className="mt-4" onClick={() => setStep(1)}>
            <ChevronLeft aria-hidden /> Zamanı değiştir
          </Button>
        )}
      </Card>

      {/* Özet */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-subtle">Özet</p>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              { i: MapPin, l: 'İstasyon', v: station?.name ?? '—' },
              { i: Zap, l: 'Güç', v: station ? `${station.maxKw} kW · ${fmt.num(station.pricePerKwh)} ₺/kWh` : '—' },
              { i: CalendarCheck2, l: 'Zaman', v: slot ? `${new Date(date + 'T00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · ${slot} · ${duration} dk` : '—' },
              { i: CreditCard, l: 'Tahmini tutar', v: station ? fmt.try(estimate) : '—' },
            ].map((r) => (
              <div key={r.l} className="flex items-start gap-3">
                <r.i className="mt-0.5 size-4 shrink-0 text-neon" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-xs text-subtle">{r.l}</dt>
                  <dd className="break-words font-medium text-fg">{r.v}</dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-subtle">Tahmin: istasyon gücünün %70’i × süre × örnek tarife.</p>
        </Card>
      </aside>
    </div>
  );
}
