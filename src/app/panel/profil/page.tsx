import { PanelHeader } from '@/components/panel/panel-shell';
import { ProfileForm, PasswordForm } from '@/components/panel/profile-forms';
import { Card } from '@/components/ui/card';
import { requireUser } from '@/lib/server/auth';

export default async function Page() {
  const user = await requireUser();
  return (
    <>
      <PanelHeader title="Profil & güvenlik" description={user.email} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6"><h2 className="mb-5 font-display text-lg font-semibold">Profil bilgileri</h2><ProfileForm name={user.name} company={user.company} /></Card>
        <Card className="p-6"><h2 className="mb-5 font-display text-lg font-semibold">Parola</h2><PasswordForm /></Card>
        <Card variant="outline" className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Hesap bilgisi</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-subtle">Rol</dt><dd className="font-semibold">{user.role}</dd></div>
            <div><dt className="text-subtle">Oluşturulma</dt><dd className="font-semibold">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</dd></div>
            <div><dt className="text-subtle">Son giriş</dt><dd className="font-semibold">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('tr-TR') : '—'}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-subtle">Verilerinizin silinmesi için KVKK kapsamında iletişim formundan talepte bulunabilirsiniz.</p>
        </Card>
      </div>
    </>
  );
}
