import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/site/logo';

export default function NotFound() {
  return (
    <main id="icerik" className="grid min-h-[100svh] place-items-center px-4 text-center">
      <div>
        <LogoMark className="mx-auto size-14" />
        <p className="mt-6 font-display text-7xl font-semibold text-electric-gradient">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Bu rota haritada yok.</h1>
        <p className="mt-2 text-muted">Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild><Link href="/">Ana sayfa</Link></Button>
          <Button asChild variant="secondary"><Link href="/harita">Şarj haritası</Link></Button>
        </div>
      </div>
    </main>
  );
}
