import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/panel/auth-forms';
import { getCurrentUser } from '@/lib/server/auth';

export const metadata: Metadata = { title: 'Kayıt Ol', robots: { index: false } };

export default async function Page() {
  if (await getCurrentUser()) redirect('/panel');
  return (
    <>
      <h1 className="text-[clamp(1.9rem,1.5rem+1.6vw,2.6rem)] font-semibold">Hesabınızı oluşturun</h1>
      <p className="mb-8 mt-2 text-muted">Ücretsiz; kredi kartı gerekmez.</p>
      <RegisterForm />
    </>
  );
}
