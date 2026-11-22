import Link from 'next/link';
import { ArrowRight, CarFront, Route, CalendarClock, Leaf, Sparkles, ShieldAlert } from 'lucide-react';
import { PanelHeader } from '@/components/panel/panel-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { requireUser } from '@/lib/server/auth';
import { read } from '@/lib/server/db';
import { computeCarbon } from '@/lib/calc/carbon';
import { fmt } from '@/lib/utils';

export default async function Page({ searchParams }: { searchParams: Promise<{ hosgeldin?: string; yetki?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const data = await read((db) => ({
    vehicles: db.vehicles.filter((v) => v.userId === user.id),
    routes: db.routes.filter((r) => r.userId === user.id).slice(-3).reverse(),
    reservations: db.reservations.filter((r) => r.userId === user.id && r.status === 'confirmed'),
  }));
  const totalKm = data.routes.reduce((a, r) => a + r.distanceKm, 0);
  const v = data.vehicles[0];
  const carbon = v ? computeCarbon({ kmPerYear: 15000, evKwhPer100: v.consumptionKwhPer100, iceLitersPer100: 6.8, fuel: 'gasoline' }) : null;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  return (
    <>
      {sp.hosgeldin && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-neon/30 bg-neon/5 p-4 text-sm">
          <Sparkles className="size-5 shrink-0 text-neon" aria-hidden /> Hesabınız oluşturuldu. İlk aracınızı garajınıza ekleyerek başlayın.
        </div>
      )}
      {sp.yetki && (
        <div role="alert" className="mb-6 flex items-center gap-3 rounded-2xl border border-warn/30 bg-warn/5 p-4 text-sm">
          <ShieldAlert className="size-5 shrink-0 text-warn" aria-hidden /> Bu bölüme erişim yetkiniz yok.
        </div>
      )}
      <PanelHeader title={`${greet}, ${user.name.split(' ')[0]}`} description="Kişisel enerji ve yolculuk özetiniz." action={<Button asChild><Link href="/rota">Yeni rota <ArrowRight aria-hidden /></Link></Button>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { i: CarFront, l: 'Araç', v: String(data.vehicles.length), href: '/panel/garaj' },
          { i: Route, l: 'Kayıtlı rota', v: String(data.routes.length), href: '/panel/rotalar' },
          { i: CalendarClock, l: 'Aktif rezervasyon', v: String(data.reservations.length), href: '/panel/rezervasyonlar' },
          { i: Leaf, l: 'Yıllık CO₂ tasarrufu*', v: carbon ? `${fmt.int(carbon.savedKg)} kg` : '—', href: '/analitik' },
        ].map((s) => (
          <Link key={s.l} href={s.href} className="group rounded-3xl">
            <Card interactive className="p-5">
              <div className="flex items-center justify-between">
                <s.i className="size-5 text-neon" aria-hidden />
                <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-1" aria-hidden />
              </div>
              <p className="tabular mt-4 font-display text-3xl font-semibold">{s.v}</p>
              <p className="text-sm text-muted">{s.l}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card variant="feature" className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Varsayılan aracınız</h2>
            <Link href="/panel/garaj" className="inline-flex min-h-11 min-w-11 items-center justify-end text-sm text-neon hover:underline">Yönet</Link>
          </div>
          {v ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-display text-2xl font-semibold">{v.nickname}</p>
                <p className="text-sm text-muted">{v.plate ?? 'Plaka eklenmedi'} · {v.batteryKwh} kWh · {fmt.num(v.consumptionKwhPer100)} kWh/100km</p>
              </div>
              <div className="rounded-2xl border border-line bg-bg-2/60 px-5 py-3 text-center">
                <p className="tabular font-display text-2xl font-semibold">{fmt.int((v.batteryKwh / v.consumptionKwhPer100) * 100)} km</p>
                <p className="text-xs text-subtle">tahmini tam menzil</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-line-strong p-6 text-center">
              <p className="text-muted">Garajınızda henüz araç yok.</p>
              <Button asChild size="sm" className="mt-4"><Link href="/panel/garaj">Araç ekle</Link></Button>
            </div>
          )}
          {carbon && <p className="mt-4 text-xs text-subtle">*Yılda 15.000 km ve benzinli muadil varsayımıyla model hesabı.</p>}
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Son rotalar</h2>
          {data.routes.length ? (
            <ul className="mt-4 divide-y divide-line">
              {data.routes.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.label}</p>
                    <p className="text-xs text-subtle">{fmt.int(r.distanceKm)} km · {r.stops} durak</p>
                  </div>
                  <span className="tabular text-sm text-muted">{fmt.duration(r.totalMinutes)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Rota planlayıcıda “Panelime kaydet” ile rotalarınızı burada toplayın.</p>
          )}
          {totalKm > 0 && <p className="mt-3 text-xs text-subtle">Toplam planlanan: {fmt.int(totalKm)} km</p>}
        </Card>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-subtle">
        <StatusBadge status="live" /> Bu paneldeki veriler hesabınıza özeldir ve yalnızca size görünür.
      </div>
    </>
  );
}
