import { Download, Search } from 'lucide-react';
import { PanelHeader } from '@/components/panel/panel-shell';
import { AdminMessage, fmtDate } from '@/components/panel/admin-ui';
import { Card } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { read } from '@/lib/server/db';
import { deleteLeadAction } from '@/app/actions/admin';

const INTEREST: Record<string, string> = { surucu: 'Sürücü', filo: 'Filo', operator: 'Operatör', yatirimci: 'Yatırımcı', diger: 'Diğer' };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; interest?: string; m?: string }> }) {
  const sp = await searchParams;
  const all = await read((db) => [...db.leads].reverse());
  const q = (sp.q ?? '').trim().toLocaleLowerCase('tr');
  const list = all.filter((l) => (!q || [l.name, l.email, l.company ?? '', l.message ?? ''].some((x) => x.toLocaleLowerCase('tr').includes(q))) && (!sp.interest || sp.interest === 'all' || l.interest === sp.interest));
  return (
    <>
      <PanelHeader
        title="Erken erişim talepleri"
        description={`${all.length} talep${list.length !== all.length ? ` · ${list.length} sonuç` : ''}`}
        action={<Button asChild variant="outline" size="sm"><a href="/api/admin/export?type=leads"><Download className="size-4" aria-hidden /> CSV indir</a></Button>}
      />
      <AdminMessage code={sp.m} />
      <form method="get" className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]" role="search">
        <label htmlFor="al-q" className="sr-only">Ara</label>
        <Input id="al-q" name="q" defaultValue={sp.q} placeholder="Ad, e-posta, şirket veya mesaj ara" autoComplete="off" />
        <label htmlFor="al-i" className="sr-only">İlgi alanı</label>
        <Select id="al-i" name="interest" defaultValue={sp.interest ?? 'all'}>
          <option value="all">Tüm ilgi alanları</option>
          {Object.entries(INTEREST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Button type="submit"><Search className="size-4" aria-hidden /> Filtrele</Button>
      </form>
      <Card className="p-0">
        {list.length === 0 ? <p className="p-6 text-sm text-muted">Talep yok.</p> : (
          <ul className="divide-y divide-line">
            {list.map((l) => (
              <li key={l.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{l.name} <span className="text-xs font-normal text-subtle">· {INTEREST[l.interest] ?? l.interest} · {fmtDate(l.createdAt, true)}</span></p>
                  <p className="text-sm text-muted"><a href={`mailto:${l.email}`} className="hover:text-neon">{l.email}</a>{l.company ? ` · ${l.company}` : ''}</p>
                  {l.message && <p className="mt-1 whitespace-pre-line text-sm text-muted">{l.message}</p>}
                  <p className="mt-1 text-[11px] text-subtle">KVKK onayı: {l.consent ? 'verildi' : 'yok'}</p>
                </div>
                <form action={deleteLeadAction} className="shrink-0">
                  <input type="hidden" name="id" value={l.id} />
                  <Button type="submit" variant="outline" size="sm" aria-label={`${l.name} talebini sil`}>Sil</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
