import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { newId, write } from '@/lib/server/db';
import { toCsv } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/** GET /api/admin/export?type=users|leads — yalnızca yönetici; kişisel veri içerir, önbelleğe alınmaz, işlem kaydı tutulur. */
export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  const type = req.nextUrl.searchParams.get('type');
  if (type !== 'users' && type !== 'leads') return NextResponse.json({ error: 'type=users|leads' }, { status: 400 });
  const date = (d?: string) => (d ? new Date(d).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '');
  const csv = await write((db) => {
    db.audit.push({ id: newId('aud'), at: new Date().toISOString(), actorId: me.id, actorEmail: me.email, action: 'export', target: type === 'users' ? 'kullanıcılar' : 'erken erişim talepleri' });
    if (type === 'users') {
      return toCsv([
        ['Ad', 'E-posta', 'Şirket', 'Rol', 'Durum', 'Kayıt', 'Son giriş', 'Araç', 'Kayıtlı rota'],
        ...db.users.map((u) => [u.name, u.email, u.company, u.role, u.disabledAt ? 'askıda' : 'aktif', date(u.createdAt), date(u.lastLoginAt), db.vehicles.filter((v) => v.userId === u.id).length, db.routes.filter((r) => r.userId === u.id).length]),
      ]);
    }
    return toCsv([['Ad', 'E-posta', 'Şirket', 'İlgi', 'Mesaj', 'KVKK onayı', 'Tarih'], ...db.leads.map((l) => [l.name, l.email, l.company, l.interest, l.message, l.consent ? 'evet' : 'hayır', date(l.createdAt)])]);
  });
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="narj-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
