'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { addVehicleAction } from '@/app/actions/panel';
import type { FormState } from '@/app/actions/auth';
import { DEFAULT_VEHICLE_ID, VEHICLE_PROFILES } from '@/lib/data/vehicles';
import { Field, Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function VehicleForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addVehicleAction, {});
  const [pid, setPid] = useState(DEFAULT_VEHICLE_ID);
  const p = VEHICLE_PROFILES.find((x) => x.id === pid)!;
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  const e = state.errors ?? {};
  const v = state.ok ? {} : (state.values ?? {});
  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2" noValidate key={`${pid}-${JSON.stringify(state)}`}>
      <Field label="Araç adı" htmlFor="vf-n" error={e.nickname}>
        <Input id="vf-n" name="nickname" placeholder="Örn. Aile aracı" defaultValue={v.nickname} aria-invalid={!!e.nickname} />
      </Field>
      <Field label="Togg sürümü" htmlFor="vf-p">
        <Select id="vf-p" name="profileId" defaultValue={pid} onChange={(ev) => setPid(ev.target.value)}>
          {VEHICLE_PROFILES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </Select>
      </Field>
      <Field label="Batarya (kWh)" htmlFor="vf-b" error={e.batteryKwh}>
        <Input id="vf-b" name="batteryKwh" type="number" inputMode="decimal" step="0.1" defaultValue={v.batteryKwh ?? p.batteryKwh} aria-invalid={!!e.batteryKwh} />
      </Field>
      <Field label="Tüketim (kWh/100 km)" htmlFor="vf-c" error={e.consumptionKwhPer100}>
        <Input id="vf-c" name="consumptionKwhPer100" type="number" inputMode="decimal" step="0.1" defaultValue={v.consumptionKwhPer100 ?? p.consumptionKwhPer100} aria-invalid={!!e.consumptionKwhPer100} />
      </Field>
      <Field label="Maks. DC (kW)" htmlFor="vf-d" error={e.maxDcKw}>
        <Input id="vf-d" name="maxDcKw" type="number" inputMode="numeric" defaultValue={v.maxDcKw ?? p.maxDcKw} aria-invalid={!!e.maxDcKw} />
      </Field>
      <Field label="Plaka (opsiyonel)" htmlFor="vf-pl" error={e.plate}>
        <Input id="vf-pl" name="plate" placeholder="34 ABC 123" defaultValue={v.plate} autoCapitalize="characters" aria-invalid={!!e.plate} />
      </Field>
      {state.message && <p role="status" className={state.ok ? 'text-sm text-ok sm:col-span-2' : 'text-sm text-danger sm:col-span-2'}>{state.message}</p>}
      <Button type="submit" disabled={pending} className="sm:col-span-2 sm:justify-self-start">
        <Plus aria-hidden /> {pending ? 'Ekleniyor…' : 'Garaja ekle'}
      </Button>
    </form>
  );
}
