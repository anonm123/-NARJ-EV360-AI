import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './reveal';
import { Button } from '@/components/ui/button';

export function CtaBand({ title = 'İlk sürücüler arasında olun.', text = 'Erken erişim listesine katılın; lansman, pilot filo programı ve operatör entegrasyonlarından ilk siz haberdar olun.' }: { title?: string; text?: string }) {
  return (
    <section className="py-20 sm:py-24">
      <div className="shell">
        <Reveal className="relative overflow-hidden rounded-[32px] border border-neon/20 bg-[linear-gradient(120deg,#07192a,#0a2433_50%,#06222a)] p-8 sm:p-14">
          <div aria-hidden className="absolute -right-10 -top-24 size-96 rounded-full bg-neon/20 blur-3xl" />
          <div aria-hidden className="grid-texture absolute inset-0 opacity-50" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-[clamp(1.8rem,1.3rem+2.2vw,3rem)] font-semibold">{title}</h2>
              <p className="mt-4 text-lg text-muted">{text}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/iletisim">
                  Erken erişim <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/kayit">Hesap oluştur</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
