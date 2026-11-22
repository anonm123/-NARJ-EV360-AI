import Link from 'next/link';
import { Trash2, Route } from 'lucide-react';
import { PanelHeader } from '@/components/panel/panel-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/server/auth';
import { read } from '@/lib/server/db';
import { deleteRouteAction } from '@/app/actions/panel';
import { fmt } from '@/lib/utils';

export default async function Page() {
  const user = await requireUser();
  const routes = await read((db) => db.routes.filter((r) => r.userId === user.id).reverse());
  return (
    <>
      <PanelHeader title="Rotalarım" description="Rota planlayıcıdan kaydettiğiniz yolculuklar." action={<Button asChild><Link href="/rota"><Route aria-hidden /> Yeni rota</Link></Button>} />
      {routes.length === 0 ? (
        <Card variant="outline" className="p-10 text-center text-muted">Kayıtlı rota yok. Rota planlayıcıda “Panelime kaydet” düğmesini kullanın.</Card>
      ) : (
        <ul className="space-y-3">
          {routes.map((r) => (
            <li key={r.id}>
              <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">{r.label}</p>
                  <p className="text-xs text-subtle">{new Date(r.createdAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {[`${fmt.int(r.distanceKm)} km`, `${r.stops} durak`, fmt.duration(r.totalMinutes), fmt.try(r.totalCost)].map((x) => (
                    <span key={x} className="tabular rounded-full border border-line px-3 py-1.5 text-muted">{x}</span>
                  ))}
                  <form action={deleteRouteAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="grid size-11 place-items-center rounded-full border border-line text-muted hover:text-danger" aria-label={`${r.label} rotasını sil`}><Trash2 className="size-4" aria-hidden /></button>
                  </form>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
