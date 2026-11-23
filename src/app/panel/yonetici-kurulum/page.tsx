import { redirect } from 'next/navigation';
import { PanelHeader } from '@/components/panel/panel-shell';
import { AdminSetupForm } from '@/components/panel/admin-setup-form';
import { Card } from '@/components/ui/card';
import { requireUser } from '@/lib/server/auth';

export default async function Page() {
  const user = await requireUser();
  if (user.role === 'admin') redirect('/panel/yonetim');
  const configured = (process.env.NARJ_ADMIN_SETUP_CODE ?? '').length >= 16;
  return (
    <>
      <PanelHeader title="Yönetici kurulumu" description="Site sahibinin kendi hesabını yönetici yapması için tek seferlik adım." />
      <Card className="max-w-xl p-6">
        {configured ? (
          <>
            <p className="mb-5 text-sm text-muted">Render → Environment bölümüne eklediğiniz <code>NARJ_ADMIN_SETUP_CODE</code> değerini girin. Doğruysa <strong className="text-fg">{user.email}</strong> hesabı yönetici olur.</p>
            <AdminSetupForm />
          </>
        ) : (
          <p className="text-sm text-muted">Kurulum kodu sunucuda tanımlı değil. Render → servis → Environment bölümüne en az 16 karakterlik rastgele bir <code>NARJ_ADMIN_SETUP_CODE</code> ekleyin, servis yeniden başlayınca bu sayfaya dönün.</p>
        )}
      </Card>
    </>
  );
}
