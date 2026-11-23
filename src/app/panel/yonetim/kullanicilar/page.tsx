import Link from 'next/link';
import { Download, Search } from 'lucide-react';
import { PanelHeader } from '@/components/panel/panel-shell';
import { AdminMessage, RoleBadge, StatusPill, fmtDate } from '@/components/panel/admin-ui';
import { Card } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { read } from '@/lib/server/db';
import { filterUsers } from '@/lib/admin';

type SP = { q?: string; role?: string; status?: string; m?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const now = Date.now();
  const data = await read((db) => {
    const online = new Set(db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now).map((s) => s.userId));
    return db.users.map(({ passwordHash: _p, ...u }) => ({
      ...u,
      online: online.has(u.id),
      vehicles: db.vehicles.filter((v) => v.userId === u.id).length,
      routes: db.routes.filter((r) => r.userId === u.id).length,
    }));
  });
  const list = filterUsers(data, sp).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PanelHeader
        title="Kullanıcılar"
        description={`${data.length} kayıtlı hesap${list.length !== data.length ? ` · ${list.length} sonuç` : ''}`}
        action={
          <Button asChild variant="outline" size="sm">
            <a href="/api/admin/export?type=users"><Download className="size-4" aria-hidden /> CSV indir</a>
          </Button>
        }
      />
      <AdminMessage code={sp.m} />
      <form method="get" className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <label htmlFor="au-q" className="sr-only">Ara</label>
        <Input id="au-q" name="q" defaultValue={sp.q} placeholder="Ad, e-posta veya şirket ara" autoComplete="off" />
        <label htmlFor="au-role" className="sr-only">Rol</label>
        <Select id="au-role" name="role" defaultValue={sp.role ?? 'all'}>
          <option value="all">Tüm roller</option>
          <option value="driver">Sürücü</option>
          <option value="fleet">Filo</option>
          <option value="operator">Operatör</option>
          <option value="admin">Yönetici</option>
        </Select>
        <label htmlFor="au-status" className="sr-only">Durum</label>
        <Select id="au-status" name="status" defaultValue={sp.status ?? 'all'}>
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="suspended">Askıda</option>
        </Select>
        <Button type="submit"><Search className="size-4" aria-hidden /> Filtrele</Button>
      </form>

      <Card className="overflow-hidden p-0">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-muted">Filtreye uyan kullanıcı yok.</p>
        ) : (
          <>
            {/* Telefon: kart listesi */}
            <ul className="divide-y divide-line md:hidden">
              {list.map((u) => (
                <li key={u.id}>
                  <Link href={`/panel/yonetim/kullanicilar/${u.id}`} className="block min-h-16 px-4 py-3 hover:bg-white/[0.03]">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{u.name}</span>
                      <RoleBadge role={u.role} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{u.email}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-subtle">
                      <StatusPill disabled={u.disabledAt} /> Kayıt {fmtDate(u.createdAt)} · Son giriş {fmtDate(u.lastLoginAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* Masaüstü: tablo */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Kullanıcı listesi</caption>
                <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
                  <tr>{['Kullanıcı', 'Rol', 'Durum', 'Kayıt', 'Son giriş', 'Araç / rota', ''].map((h) => <th key={h} scope="col" className="px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {list.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{u.name} {u.online && <span className="ml-1 inline-block size-2 rounded-full bg-ok align-middle" title="Oturumu açık" aria-label="Oturumu açık" />}</p>
                        <p className="text-xs text-muted">{u.email}{u.company ? ` · ${u.company}` : ''}</p>
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3"><StatusPill disabled={u.disabledAt} /></td>
                      <td className="px-4 py-3 text-muted">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-muted">{fmtDate(u.lastLoginAt, true)}</td>
                      <td className="tabular px-4 py-3 text-muted">{u.vehicles} / {u.routes}</td>
                      <td className="px-4 py-3 text-right"><Link href={`/panel/yonetim/kullanicilar/${u.id}`} className="inline-flex min-h-10 items-center rounded-full border border-line px-3 text-xs font-semibold hover:border-neon/50">Yönet</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
