/** Yönetim paneli için saf yardımcılar (sunucu/istemci bağımsız; birim testleri bunları kullanır). */

export type AdminRole = 'driver' | 'fleet' | 'operator' | 'admin';
export const ROLE_LABEL: Record<AdminRole, string> = { driver: 'Sürücü', fleet: 'Filo yöneticisi', operator: 'Operatör', admin: 'Yönetici' };

export const ACTION_LABEL: Record<string, string> = {
  role: 'rol değiştirdi',
  suspend: 'askıya aldı',
  activate: 'etkinleştirdi',
  sessions_revoked: 'oturumları kapattı',
  user_deleted: 'kullanıcıyı sildi',
  lead_deleted: 'talebi sildi',
  export: 'CSV indirdi',
  admin_setup: 'yönetici kurulumu',
};

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: AdminRole;
  createdAt: string;
  lastLoginAt?: string;
  disabledAt?: string;
}

/**
 * CSV üretir: Excel'in Türkçe karakterleri doğru açması için UTF-8 BOM, alan kaçışları ve
 * formül enjeksiyonuna karşı koruma (=, +, -, @ ile başlayan hücrelerin başına ' eklenir).
 */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

/** Son `days` günün günlük kayıt sayıları (en eskiden en yeniye), Türkiye saatiyle gün sınırı. */
export function signupSeries(dates: string[], days: number, now = new Date()): { day: string; count: number }[] {
  const key = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const out: { day: string; count: number }[] = [];
  const index = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const k = key(new Date(now.getTime() - i * 864e5));
    index.set(k, out.length);
    out.push({ day: k, count: 0 });
  }
  for (const d of dates) {
    const i = index.get(key(new Date(d)));
    if (i != null) out[i].count++;
  }
  return out;
}

export function filterUsers<T extends AdminUserRow>(users: T[], f: { q?: string; role?: string; status?: string }): T[] {
  const q = (f.q ?? '').trim().toLocaleLowerCase('tr');
  return users.filter((u) => {
    if (q && ![u.name, u.email, u.company ?? ''].some((x) => x.toLocaleLowerCase('tr').includes(q))) return false;
    if (f.role && f.role !== 'all' && u.role !== f.role) return false;
    if (f.status === 'active' && u.disabledAt) return false;
    if (f.status === 'suspended' && !u.disabledAt) return false;
    return true;
  });
}

/** İşlem sonrası en az bir aktif yönetici kalıyor mu? (son yöneticinin rolü alınamaz / askıya alınamaz / silinemez) */
export function keepsAnAdmin(users: Pick<AdminUserRow, 'id' | 'role' | 'disabledAt'>[], targetId: string, change: { role?: AdminRole; disable?: boolean; remove?: boolean }): boolean {
  const after = users
    .filter((u) => !(change.remove && u.id === targetId))
    .map((u) => (u.id === targetId ? { ...u, role: change.role ?? u.role, disabledAt: change.disable ? 'x' : u.disabledAt } : u));
  return after.some((u) => u.role === 'admin' && !u.disabledAt);
}
