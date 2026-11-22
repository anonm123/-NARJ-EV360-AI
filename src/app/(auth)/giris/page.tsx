import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/panel/auth-forms';
import { getCurrentUser } from '@/lib/server/auth';
import { demoAccounts, seedEnabled } from '@/lib/server/seed';

export const metadata: Metadata = { title: 'Giriş', robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; demo?: string }> }) {
  const { next, demo } = await searchParams;
  if (await getCurrentUser()) redirect('/panel');
  const demos = seedEnabled() ? demoAccounts().map((a) => ({ email: a.email, label: a.role === 'driver' ? 'Sürücü' : a.role === 'fleet' ? 'Filo yöneticisi' : 'Yönetici' })) : undefined;
  return (
    <>
      <h1 className="text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)] font-semibold">Tekrar hoş geldiniz</h1>
      <p className="mb-8 mt-2 text-muted">Panelinize giriş yapın.</p>
      <LoginForm next={next} demo={demos} demoPrefill={demo === 'filo' && seedEnabled() ? 'filo@narj.dev' : undefined} />
    </>
  );
}
