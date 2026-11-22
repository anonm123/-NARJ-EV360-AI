import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/site/logo';
import { Picture } from '@/components/site/picture';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1fr_1.05fr]">
      <main id="icerik" className="flex min-w-0 flex-col px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] sm:px-10">
        <div className="flex h-16 items-center justify-between">
          <Logo />
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-muted hover:text-fg">
            <ArrowLeft className="size-4" aria-hidden /> Siteye dön
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
      <aside className="relative hidden overflow-hidden lg:block" aria-hidden>
        <Picture name="hero-ev-night" alt="" className="absolute inset-0 size-full object-cover object-[60%_50%]" sizes="50vw" priority />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050A12_0%,rgba(5,10,18,0.2)_40%,rgba(5,10,18,0.3)_100%)]" />
        <div className="absolute inset-x-10 bottom-10">
          <div className="glass max-w-md rounded-3xl p-6">
            <p className="font-display text-2xl font-semibold">Yolun Akıllı Gücü</p>
            <p className="mt-2 text-sm text-muted">Araçlarınız, rotalarınız ve rezervasyonlarınız tek, güvenli bir panelde. Her kullanıcının alanı yalnızca kendisine aittir.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
