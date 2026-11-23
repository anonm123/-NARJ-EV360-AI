import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PanelHeader } from '@/components/panel/panel-shell';
import { AdminMessage, RoleBadge, fmtDate } from '@/components/panel/admin-ui';
import { Card } from '@/components/ui/card';
import { read } from '@/lib/server/db';
import { ACTION_LABEL, ROLE_LABEL, signupSeries, type AdminRole } from '@/lib/admin';


export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const now = Date.now();
  const d = await read((db) => ({
    users: db.users.map(({ passwordHash: _p, ...u }) => u),
    sessions: db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now),
    leads: db.leads.length,
    leads7: db.leads.filter((l) => now - new Date(l.createdAt).getTime() < 7 * 864e5).length,
    routes: db.routes.length,
    vehicles: db.vehicles.length,
    audit: db.audit.slice(-6).reverse(),
  }));
  const new7 = d.users.filter((u) => now - new Date(u.createdAt).getTime() < 7 * 864e5).length;
  const activeUsers = new Set(d.sessions.map((s) => s.userId)).size;
  const suspended = d.users.filter((u) => u.disabledAt).length;
  const series = signupSeries(d.users.map((u) => u.createdAt), 14);
  const max = Math.max(1, ...series.map((s) => s.count));
  const roles = (Object.keys(ROLE_LABEL) as AdminRole[]).map((r) => ({ r, n: d.users.filter((u) => u.role === r).length }));
  const recent = [...d.users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <>
      <PanelHeader title="Yönetim" description="Kayıtlı kullanıcılar, erken erişim talepleri ve site durumu." />
      <AdminMessage code={m} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Toplam kullanıcı', d.users.length, `${new7} yeni (7 gün)`],
          ['Oturumu açık', activeUsers, `${d.sessions.length} oturum`],
          ['Erken erişim', d.leads, `${d.leads7} yeni (7 gün)`],
          ['Askıdaki hesap', suspended, `${d.users.length - suspended} aktif · ${d.vehicles} araç · ${d.routes} rota`],
        ].map(([l, v, sub]) => (
          <Card key={String(l)} className="p-5">
            <p className="tabular font-display text-3xl font-semibold">{v}</p>
            <p className="text-sm font-semibold text-fg">{l}</p>
            <p className="mt-1 text-xs text-subtle">{sub}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h2 className="font-display text-lg font-semibold">Son 14 günde kayıtlar</h2>
          <div className="mt-5 flex h-40 items-end gap-1.5" role="img" aria-label={`Son 14 günde toplam ${series.reduce((a, s) => a + s.count, 0)} kayıt`}>
            {series.map((s) => (
              <div key={s.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="tabular text-[10px] text-subtle">{s.count || ''}</span>
                <div className="w-full rounded-t-md bg-[linear-gradient(180deg,#00E5D4,#00B8FF)]" style={{ height: `${Math.max(2, (s.count / max) * 100)}%`, opacity: s.count ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-subtle"><span>{series[0].day.slice(5)}</span><span>bugün</span></div>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold">Rol dağılımı</h2>
          <ul className="mt-4 space-y-3">
            {roles.map(({ r, n }) => (
              <li key={r}>
                <Link href={`/panel/yonetim/kullanicilar?role=${r}`} className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-line px-3 text-sm hover:border-neon/40">
                  <span>{ROLE_LABEL[r]}</span>
                  <span className="tabular font-semibold">{n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Son kayıt olanlar</h2>
            <Link href="/panel/yonetim/kullanicilar" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-neon">Tümü <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <ul className="divide-y divide-line">
            {recent.length === 0 && <li className="p-5 text-sm text-muted">Henüz kayıt yok.</li>}
            {recent.map((u) => (
              <li key={u.id}>
                <Link href={`/panel/yonetim/kullanicilar/${u.id}`} className="flex min-h-16 items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.03]">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{u.name}</span>
                    <span className="block truncate text-xs text-muted">{u.email} · {fmtDate(u.createdAt)}</span>
                  </span>
                  <RoleBadge role={u.role} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Son yönetici işlemleri</h2>
            <Link href="/panel/yonetim/sistem" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-neon">Kayıt defteri <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <ul className="divide-y divide-line">
            {d.audit.length === 0 && <li className="p-5 text-sm text-muted">Henüz işlem yok.</li>}
            {d.audit.map((a) => (
              <li key={a.id} className="px-5 py-3 text-sm">
                <p><span className="font-semibold">{a.actorEmail}</span> <span className="text-muted">{ACTION_LABEL[a.action] ?? a.action}</span> · {a.target}{a.detail ? <span className="text-subtle"> ({a.detail})</span> : null}</p>
                <p className="text-xs text-subtle">{fmtDate(a.at, true)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
