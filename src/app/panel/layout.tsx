import type { Metadata } from 'next';
import { PanelShell } from '@/components/panel/panel-shell';
import { requireUser } from '@/lib/server/auth';

export const metadata: Metadata = { title: 'Panel', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <PanelShell user={{ name: user.name, email: user.email, role: user.role, company: user.company }}>{children}</PanelShell>;
}
