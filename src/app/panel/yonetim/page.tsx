import { PanelHeader } from '@/components/panel/panel-shell';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/server/auth';
import { read } from '@/lib/server/db';
import { setUserRoleAction } from '@/app/actions/panel';
import { ADAPTERS } from '@/lib/adapters';
import { projectRevenue, REVENUE_PRESETS } from '@/lib/calc/revenue';
import { fmt } from '@/lib/utils';

export default async function Page() {
  const admin = await requireUser(['admin']);
  const d = await read((db) => ({
    users: db.users.map(({ passwordHash: _p, ...u }) => u),
    leads: [...db.leads].reverse().slice(0, 20),
    reservations: db.reservations.length,
    routes: db.routes.length,
    sessions: db.sessions.filter((s) => new Date(s.expiresAt).getTime() > Date.now()).length,
  }));
  const rev = projectRevenue(REVENUE_PRESETS.baz);
  return (
    <>
      <PanelHeader title="Yönetim" description="Platform kullanıcıları, talepler ve entegrasyon durumu." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Kullanıcı', d.users.length],
          ['Aktif oturum', d.sessions],
          ['Erken erişim', d.leads.length],
          ['Rezervasyon (demo)', d.reservations],
          ['Kayıtlı rota', d.routes],
        ].map(([l, v]) => (
          <Card key={String(l)} className="p-5">
            <p className="tabular font-display text-2xl font-semibold">{v}</p>
            <p className="text-sm text-muted">{l}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <h2 className="border-b border-line px-5 py-4 font-display text-lg font-semibold">Kullanıcılar</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Kullanıcı listesi</caption>
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
              <tr>{['Ad', 'E-posta', 'Kayıt', 'Rol'].map((h) => <th key={h} scope="col" className="px-5 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {d.users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 font-semibold">{u.name}</td>
                  <td className="px-5 py-3 text-muted">{u.email}</td>
                  <td className="px-5 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td className="px-5 py-3">
                    {u.id === admin.id ? (
                      <span className="text-subtle">{u.role} (siz)</span>
                    ) : (
                      <form action={setUserRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <label className="sr-only" htmlFor={`role-${u.id}`}>{u.name} rolü</label>
                        <select id={`role-${u.id}`} name="role" defaultValue={u.role} className="min-h-10 rounded-lg border border-line bg-bg-2 px-2 text-sm">
                          <option value="driver">driver</option>
                          <option value="fleet">fleet</option>
                          <option value="operator">operator</option>
                          <option value="admin">admin</option>
                        </select>
                        <Button type="submit" size="sm" variant="outline">Kaydet</Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold">Erken erişim talepleri</h2>
          {d.leads.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Henüz talep yok.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {d.leads.map((l) => (
                <li key={l.id} className="py-3 text-sm">
                  <p className="font-semibold">{l.name} <span className="font-normal text-subtle">· {l.interest}</span></p>
                  <p className="text-muted">{l.email}{l.company ? ` · ${l.company}` : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold">Operatör adaptörleri</h2>
          <ul className="mt-3 divide-y divide-line">
            {ADAPTERS.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0"><p className="truncate font-semibold">{a.name}</p><p className="text-xs text-subtle">{a.protocol}</p></div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
          <h3 className="mt-6 font-semibold">Baz gelir senaryosu</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {rev.map((r) => <span key={r.year} className="tabular rounded-full border border-line px-3 py-1.5 text-muted">{r.year}. yıl {fmt.compactTry(r.total)}</span>)}
          </div>
          <p className="mt-2 text-xs text-subtle">Model; tahmin değildir. Ayrıntı: Yatırımcı ilişkileri sayfası.</p>
        </Card>
      </div>
    </>
  );
}
