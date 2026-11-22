import { Trash2 } from 'lucide-react';
import { PanelHeader } from '@/components/panel/panel-shell';
import { VehicleForm } from '@/components/panel/vehicle-form';
import { Card } from '@/components/ui/card';
import { requireUser } from '@/lib/server/auth';
import { read } from '@/lib/server/db';
import { deleteVehicleAction } from '@/app/actions/panel';
import { vehicleById } from '@/lib/data/vehicles';
import { fmt } from '@/lib/utils';

export default async function Page() {
  const user = await requireUser();
  const vehicles = await read((db) => db.vehicles.filter((v) => v.userId === user.id));
  return (
    <>
      <PanelHeader title="Garajım" description="Araçlarınızın teknik değerleri tüm hesaplamalarda kullanılır." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {vehicles.length === 0 && <Card variant="outline" className="p-8 text-center text-muted sm:col-span-2">Henüz araç eklemediniz.</Card>}
          {vehicles.map((v) => (
            <Card key={v.id} variant="feature" className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold">{v.nickname}</p>
                  <p className="text-xs text-subtle">{vehicleById(v.profileId)?.name ?? 'Özel'} {v.plate ? `· ${v.plate}` : ''}</p>
                </div>
                <form action={deleteVehicleAction}>
                  <input type="hidden" name="id" value={v.id} />
                  <button type="submit" className="grid size-11 place-items-center rounded-full border border-line text-muted hover:border-danger/50 hover:text-danger" aria-label={`${v.nickname} aracını sil`}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </form>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ['Batarya', `${v.batteryKwh} kWh`],
                  ['Tüketim', fmt.num(v.consumptionKwhPer100)],
                  ['Menzil', `${fmt.int((v.batteryKwh / v.consumptionKwhPer100) * 100)} km`],
                ].map(([l, val]) => (
                  <div key={l} className="rounded-xl border border-line bg-bg-2/60 p-2.5">
                    <dt className="text-[11px] text-subtle">{l}</dt>
                    <dd className="tabular text-sm font-semibold">{val}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
        <Card variant="glass" className="p-6 xl:sticky xl:top-10 xl:self-start">
          <h2 className="font-display text-lg font-semibold">Yeni araç</h2>
          <p className="mb-5 mt-1 text-sm text-muted">Şablon seçip değerleri aracınıza göre düzenleyin.</p>
          <VehicleForm />
        </Card>
      </div>
    </>
  );
}
