import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MESSAGES: Record<string, { ok: boolean; text: string }> = {
  setup: { ok: true, text: 'Hesabınız yönetici yapıldı.' },
  role: { ok: true, text: 'Rol güncellendi.' },
  same: { ok: true, text: 'Rol zaten buydu; değişiklik yapılmadı.' },
  suspended: { ok: true, text: 'Hesap askıya alındı ve açık oturumları kapatıldı.' },
  activated: { ok: true, text: 'Hesap yeniden etkinleştirildi.' },
  revoked: { ok: true, text: 'Kullanıcının tüm oturumları kapatıldı.' },
  deleted: { ok: true, text: 'Kayıt kalıcı olarak silindi.' },
  self: { ok: false, text: 'Kendi hesabınızı buradan değiştiremezsiniz (Profil sayfasını kullanın).' },
  lastadmin: { ok: false, text: 'Son aktif yöneticinin yetkisi kaldırılamaz, askıya alınamaz veya silinemez.' },
  confirm: { ok: false, text: 'Silme onayı için kullanıcının e-posta adresini aynen yazın.' },
  notfound: { ok: false, text: 'Kullanıcı bulunamadı.' },
};

export function AdminMessage({ code }: { code?: string }) {
  const m = code ? MESSAGES[code] : undefined;
  if (!m) return null;
  const Icon = m.ok ? CheckCircle2 : AlertTriangle;
  return (
    <p role={m.ok ? 'status' : 'alert'} className={cn('mb-6 flex items-center gap-2 rounded-2xl border p-4 text-sm', m.ok ? 'border-ok/40 bg-ok/5 text-fg' : 'border-danger/40 bg-danger/5 text-danger')}>
      <Icon className="size-4 shrink-0" aria-hidden /> {m.text}
    </p>
  );
}

export const fmtDate = (d?: string | null, withTime = false) =>
  d ? new Date(d).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' } : {}) }) : '—';

export function RoleBadge({ role }: { role: string }) {
  const tone: Record<string, string> = { admin: 'border-neon/50 text-neon', fleet: 'border-electric/50 text-electric', operator: 'border-warn/50 text-warn', driver: 'border-line text-muted' };
  const label: Record<string, string> = { admin: 'Yönetici', fleet: 'Filo', operator: 'Operatör', driver: 'Sürücü' };
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', tone[role] ?? tone.driver)}>{label[role] ?? role}</span>;
}

export function StatusPill({ disabled }: { disabled?: string }) {
  return disabled ? (
    <span className="inline-flex items-center rounded-full border border-danger/40 px-2.5 py-0.5 text-xs font-semibold text-danger">Askıda</span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-ok/40 px-2.5 py-0.5 text-xs font-semibold text-ok">Aktif</span>
  );
}
