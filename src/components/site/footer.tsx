import Link from 'next/link';
import { NAV, LEGAL } from '@/lib/nav';
import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-line bg-bg-2 pb-[env(safe-area-inset-bottom)]">
      <div aria-hidden className="hairline absolute inset-x-0 top-0" />
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Yapay zekâ destekli elektrikli araç şarjı, rota optimizasyonu, enerji yönetimi ve filo SaaS platformu. Lansman öncesi geliştirme aşamasındadır.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-subtle">
            Haritadaki istasyonlar, doluluk bilgileri ve operatör tarifeleri örnek/simülasyon verisidir. NAR-J şu an hiçbir şarj operatörüyle resmi iş ortaklığı bulunduğunu iddia etmez.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {NAV.map((g) => (
            <div key={g.label} className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">{g.label}</p>
              <ul className="mt-4 space-y-1">
                {g.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className="inline-flex min-h-9 items-center text-sm text-muted transition-colors hover:text-fg">
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-col gap-3 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NAR-J EV360-AI · Yolun Akıllı Gücü</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-9 items-center hover:text-fg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
