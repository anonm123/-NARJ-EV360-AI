import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PanelHeader } from '@/components/panel/panel-shell';
import { AdminMessage, RoleBadge, StatusPill, fmtDate } from '@/components/panel/admin-ui';
import { Card } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/server/auth';
import { read } from '@/lib/server/db';
import { ACTION_LABEL } from '@/lib/admin';
import { deleteUserAction, revokeSessionsAction, setUserRoleAction, setUserStatusAction } from '@/app/actions/admin';

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ m?: string }> }) {
  const [{ id }, { m }] = await Promise.all([params, searchParams]);
  const me = await requireUser(['admin']);
  const now = Date.now();
  const d = await read((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return null;
    const { passwordHash: _p, ...user } = u;
    return {
      user,
      sessions: db.sessions.filter((s) => s.userId === id && new Date(s.expiresAt).getTime() > now).length,
      vehicles: db.vehicles.filter((v) => v.userId === id),
      routes: db.routes.filter((r) => r.userId === id).slice(-5).reverse(),
      reservations: db.reservations.filter((r) => r.userId === id).length,
      fleet: db.fleet.filter((f) => f.userId === id).length,
      lead: db.leads.find((l) => l.email === u.email) ?? null,
      audit: db.audit.filter((a) => a.target === u.email).slice(-8).reverse(),
    };
  });
  if (!d) notFound();
  const u = d.user;
  const self = u.id === me.id;

  return (
    <>
      <Link href="/panel/yonetim/kullanicilar" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> Kullanıcılar</Link>
      <PanelHeader title={u.name} description={u.email} />
      <AdminMessage code={m} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2"><RoleBadge role={u.role} /><StatusPill disabled={u.disabledAt} />{self && <span className="text-xs text-subtle">(siz)</span>}</div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Şirket', u.company ?? '—'],
              ['Kayıt', fmtDate(u.createdAt, true)],
              ['Son giriş', fmtDate(u.lastLoginAt, true)],
              ['Açık oturum', d.sessions],
              ['Araç', d.vehicles.length],
              ['Rezervasyon (demo)', d.reservations],
              ['Filo aracı', d.fleet],
              ['Askıya alınma', u.disabledAt ? fmtDate(u.disabledAt, true) : '—'],
              ['Erken erişim kaydı', d.lead ? `${d.lead.interest} · ${fmtDate(d.lead.createdAt)}` : 'yok'],
            ].map(([k, v]) => (
              <div key={String(k)}><dt className="text-xs text-subtle">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
          </dl>
          {d.vehicles.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold">Araçlar</h3>
              <ul className="mt-2 flex flex-wrap gap-2 text-xs">{d.vehicles.map((v) => <li key={v.id} className="rounded-full border border-line px-3 py-1.5 text-muted">{v.nickname} · {v.batteryKwh} kWh</li>)}</ul>
            </>
          )}
          {d.routes.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold">Son kayıtlı rotalar</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted">{d.routes.map((r) => <li key={r.id}>{r.label} · {Math.round(r.distanceKm)} km · {fmtDate(r.createdAt)}</li>)}</ul>
            </>
          )}
          <h3 className="mt-6 text-sm font-semibold">Bu hesapla ilgili yönetici işlemleri</h3>
          {d.audit.length === 0 ? <p className="mt-2 text-sm text-muted">Yok.</p> : (
            <ul className="mt-2 space-y-1 text-sm">{d.audit.map((a) => <li key={a.id} className="text-muted"><span className="text-fg">{a.actorEmail}</span> {ACTION_LABEL[a.action] ?? a.action}{a.detail ? ` (${a.detail})` : ''} · {fmtDate(a.at, true)}</li>)}</ul>
          )}
        </Card>

        <div className="space-y-6">
          {self ? (
            <Card className="p-5 text-sm text-muted">Kendi hesabınızın rolünü veya durumunu buradan değiştiremezsiniz. Ad ve parola için <Link className="text-neon" href="/panel/profil">Profil</Link> sayfasını kullanın.</Card>
          ) : (
            <>
              <Card className="p-5">
                <h2 className="font-display text-base font-semibold">Rol</h2>
                <form action={setUserRoleAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <label htmlFor="ad-role" className="sr-only">Yeni rol</label>
                  <Select id="ad-role" name="role" defaultValue={u.role} className="flex-1">
                    <option value="driver">Sürücü</option>
                    <option value="fleet">Filo yöneticisi</option>
                    <option value="operator">Operatör</option>
                    <option value="admin">Yönetici</option>
                  </Select>
                  <Button type="submit" variant="outline">Kaydet</Button>
                </form>
                <p className="mt-2 text-xs text-subtle">Yönetici rolü tüm kullanıcıları görme ve yönetme yetkisi verir.</p>
              </Card>
              <Card className="space-y-3 p-5">
                <h2 className="font-display text-base font-semibold">Erişim</h2>
                <form action={setUserStatusAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="op" value={u.disabledAt ? 'activate' : 'suspend'} />
                  <Button type="submit" variant="outline" className="w-full">{u.disabledAt ? 'Hesabı yeniden etkinleştir' : 'Hesabı askıya al'}</Button>
                </form>
                <form action={revokeSessionsAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <Button type="submit" variant="outline" className="w-full" disabled={d.sessions === 0}>Tüm oturumları kapat ({d.sessions})</Button>
                </form>
                <p className="text-xs text-subtle">Askıya alınan kullanıcı giriş yapamaz; verileri silinmez.</p>
              </Card>
              <Card className="border-danger/30 p-5">
                <h2 className="font-display text-base font-semibold text-danger">Hesabı kalıcı sil</h2>
                <p className="mt-1 text-xs text-muted">Kullanıcı, araçları, rotaları ve oturumları silinir; geri alınamaz (ör. KVKK silme talebi).</p>
                <form action={deleteUserAction} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={u.id} />
                  <label htmlFor="ad-confirm" className="block text-xs text-muted">Onay için e-postayı yazın: <span className="font-semibold text-fg">{u.email}</span></label>
                  <Input id="ad-confirm" name="confirm" autoComplete="off" required />
                  <Button type="submit" variant="outline" className="w-full border-danger/50 text-danger hover:bg-danger/10">Kalıcı olarak sil</Button>
                </form>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
