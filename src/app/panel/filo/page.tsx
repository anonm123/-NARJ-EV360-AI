import { PanelHeader } from '@/components/panel/panel-shell';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { requireUser } from '@/lib/server/auth';
import { read } from '@/lib/server/db';
import { vehicleById } from '@/lib/data/vehicles';
import { cn, fmt } from '@/lib/utils';

const ST = { yolda: 'text-electric', şarjda: 'text-neon', depoda: 'text-muted' } as const;

export default async function Page() {
  const user = await requireUser(['fleet', 'admin']);
  const fleet = await read((db) => db.fleet.filter((f) => user.role === 'admin' || f.userId === user.id));
  const avg = fleet.length ? fleet.reduce((a, f) => a + f.soc, 0) / fleet.length : 0;
  const km = fleet.reduce((a, f) => a + f.kmToday, 0);
  const kwh = fleet.reduce((a, f) => a + (f.kmToday / 100) * (vehicleById(f.profileId)?.consumptionKwhPer100 ?? 18), 0);
  const low = fleet.filter((f) => f.soc < 25);
  return (
    <>
      <PanelHeader title="Filo paneli" description={user.company ?? 'Filonuz'} action={<StatusBadge status="sample" label="Örnek filo verisi" />} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Araç', String(fleet.length)],
          ['Ort. şarj', `%${fmt.int(avg)}`],
          ['Bugün km', fmt.int(km)],
          ['Tahmini enerji', `${fmt.int(kwh)} kWh`],
        ].map(([l, v]) => (
          <Card key={l} className="p-5">
            <p className="tabular font-display text-2xl font-semibold">{v}</p>
            <p className="text-sm text-muted">{l}</p>
          </Card>
        ))}
      </div>
      {low.length > 0 && (
        <div role="alert" className="mt-6 rounded-2xl border border-warn/30 bg-warn/5 p-4 text-sm">
          <span className="font-semibold text-warn">Düşük şarj uyarısı:</span> {low.map((f) => `${f.plate} (%${f.soc})`).join(', ')} için şarj planlanması önerilir.
        </div>
      )}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Filo araçları</caption>
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
              <tr>{['Plaka', 'Sürücü', 'Profil', 'Şarj', 'Durum', 'Bugün'].map((h) => <th key={h} scope="col" className="px-5 py-3.5">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {fleet.map((f) => (
                <tr key={f.id} className="hover:bg-white/[0.02]">
                  <td className="tabular px-5 py-3.5 font-semibold">{f.plate}</td>
                  <td className="px-5 py-3.5 text-muted">{f.driver}</td>
                  <td className="px-5 py-3.5 text-muted">{vehicleById(f.profileId)?.name}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-white/10"><div className={cn('h-full rounded-full', f.soc < 25 ? 'bg-warn' : 'bg-gradient-to-r from-electric to-neon')} style={{ width: `${f.soc}%` }} /></div>
                      <span className="tabular text-xs">%{f.soc}</span>
                    </div>
                  </td>
                  <td className={cn('px-5 py-3.5 font-medium capitalize', ST[f.status])}>{f.status}</td>
                  <td className="tabular px-5 py-3.5 text-muted">{f.kmToday} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-4 text-xs text-subtle">Araç verileri demo amaçlı örnek kayıtlardır; telematik/OEM entegrasyonu ile canlı veri planlanmaktadır.</p>
    </>
  );
}
