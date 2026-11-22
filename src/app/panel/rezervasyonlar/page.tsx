import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { PanelHeader } from '@/components/panel/panel-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { requireUser } from '@/lib/server/auth';
import { read } from '@/lib/server/db';
import { cancelReservationAction } from '@/app/actions/panel';
import { fmt } from '@/lib/utils';

export default async function Page() {
  const user = await requireUser();
  const list = await read((db) => db.reservations.filter((r) => r.userId === user.id).reverse());
  return (
    <>
      <PanelHeader title="Rezervasyonlar" description="Demo rezervasyonlarınız. Gerçek ödeme alınmamıştır." action={<Button asChild><Link href="/rezervasyon"><CalendarClock aria-hidden /> Yeni rezervasyon</Link></Button>} />
      {list.length === 0 ? (
        <Card variant="outline" className="p-10 text-center text-muted">Henüz rezervasyon yok.</Card>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id}>
              <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{r.stationName}</p>
                    <StatusBadge status="demo" />
                  </div>
                  <p className="tabular mt-1 text-sm text-muted">
                    {new Date(r.date + 'T00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} · {r.slot} · {r.durationMin} dk · {fmt.try(r.estimatedCost)} · {r.paymentRef}
                  </p>
                </div>
                {r.status === 'confirmed' ? (
                  <form action={cancelReservationAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" variant="danger" size="sm">İptal et</Button>
                  </form>
                ) : (
                  <span className="text-sm text-subtle">İptal edildi</span>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
