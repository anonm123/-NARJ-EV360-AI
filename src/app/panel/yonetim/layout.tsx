import { AlertTriangle } from 'lucide-react';
import { AdminTabs } from '@/components/panel/admin-tabs';
import { requireUser } from '@/lib/server/auth';
import { STORAGE_BACKEND } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser(['admin']);
  const ephemeral = STORAGE_BACKEND === 'file' && process.env.NODE_ENV === 'production';
  return (
    <>
      <AdminTabs />
      {ephemeral && (
        <p role="note" className="mb-6 flex items-start gap-2 rounded-2xl border border-warn/40 bg-warn/5 p-4 text-sm text-muted">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <span>
            <strong className="text-fg">Kayıtlar kalıcı değil.</strong> Veriler sunucunun geçici diskinde tutuluyor; Render her yeniden yayında veya yeniden başlatmada
            kullanıcılar ve talepler silinir. Ücretsiz Upstash Redis bağlayın (Render → Environment: <code>KV_REST_API_URL</code>, <code>KV_REST_API_TOKEN</code>) — adımlar docs/DEPLOY.md.
          </span>
        </p>
      )}
      {children}
    </>
  );
}
