'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CarFront, Route, CalendarClock, Truck, ShieldCheck, UserRound, LogOut, Map, ExternalLink } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { Logo } from '@/components/site/logo';
import { cn } from '@/lib/utils';

const ROLE_LABEL = { driver: 'Sürücü', fleet: 'Filo yöneticisi', operator: 'Operatör', admin: 'Yönetici' } as const;
type Role = keyof typeof ROLE_LABEL;

const ITEMS: { href: string; label: string; short: string; icon: typeof LayoutDashboard; roles?: Role[] }[] = [
  { href: '/panel', label: 'Genel bakış', short: 'Özet', icon: LayoutDashboard },
  { href: '/panel/garaj', label: 'Garajım', short: 'Garaj', icon: CarFront },
  { href: '/panel/rotalar', label: 'Rotalarım', short: 'Rotalar', icon: Route },
  { href: '/panel/rezervasyonlar', label: 'Rezervasyonlar', short: 'Rezerv.', icon: CalendarClock },
  { href: '/panel/filo', label: 'Filo paneli', short: 'Filo', icon: Truck, roles: ['fleet', 'admin'] },
  { href: '/panel/yonetim', label: 'Yönetim', short: 'Yönetim', icon: ShieldCheck, roles: ['admin'] },
  { href: '/panel/profil', label: 'Profil & güvenlik', short: 'Profil', icon: UserRound },
];

export function PanelShell({ user, children }: { user: { name: string; email: string; role: Role; company?: string }; children: React.ReactNode }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => !i.roles || i.roles.includes(user.role));
  const active = (href: string) => (href === '/panel' ? pathname === '/panel' : pathname.startsWith(href));
  const mobileItems = items.filter((i) => ['/panel', '/panel/garaj', '/panel/rotalar', '/panel/rezervasyonlar', '/panel/profil'].includes(i.href)).slice(0, 5);

  return (
    <div className="min-h-[100svh] lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      {/* Masaüstü kenar çubuğu */}
      <aside className="sticky top-0 hidden h-[100svh] flex-col border-r border-line bg-bg-2 lg:flex">
        <div className="px-5 py-5"><Logo /></div>
        <nav aria-label="Panel menüsü" className="flex-1 space-y-1 px-3">
          {items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={active(i.href) ? 'page' : undefined} className={cn('flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors', active(i.href) ? 'bg-[linear-gradient(110deg,rgba(0,184,255,0.16),rgba(0,229,212,0.1))] text-fg shadow-[inset_0_0_0_1px_rgba(0,229,212,0.25)]' : 'text-muted hover:bg-white/[0.04] hover:text-fg')}>
              <i.icon className={cn('size-[18px]', active(i.href) && 'text-neon')} aria-hidden /> {i.label}
            </Link>
          ))}
          <div className="my-4 h-px bg-line" />
          {[{ href: '/harita', label: 'Şarj haritası', icon: Map }, { href: '/rota', label: 'Rota planla', icon: Route }].map((i) => (
            <Link key={i.href} href={i.href} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted hover:text-fg">
              <i.icon className="size-[18px]" aria-hidden /> {i.label} <ExternalLink className="ml-auto size-3.5 opacity-50" aria-hidden />
            </Link>
          ))}
        </nav>
        <div className="m-3 rounded-2xl border border-line bg-surface p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#00B8FF,#00E5D4)] font-display font-bold text-bg">{user.name.slice(0, 1).toLocaleUpperCase('tr')}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-subtle">{ROLE_LABEL[user.role]}{user.company ? ` · ${user.company}` : ''}</p>
            </div>
          </div>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm text-muted hover:text-fg">
              <LogOut className="size-4" aria-hidden /> Çıkış yap
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobil üst çubuk */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-bg/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
          <Logo compact />
          <p className="min-w-0 truncate px-3 text-sm font-semibold">{items.find((i) => active(i.href))?.label ?? 'Panel'}</p>
          <form action={logoutAction}>
            <button type="submit" className="grid size-11 place-items-center rounded-full border border-line text-muted" aria-label="Çıkış yap">
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </header>
        {/* Rol bazlı ek bağlantılar (mobil) */}
        {items.length > mobileItems.length && (
          <nav aria-label="Ek panel bölümleri" className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line px-4 py-2 lg:hidden">
            {items.filter((i) => !mobileItems.includes(i)).map((i) => (
              <Link key={i.href} href={i.href} className={cn('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold', active(i.href) ? 'border-neon/50 text-fg' : 'border-line text-muted')}>
                <i.icon className="size-3.5" aria-hidden /> {i.label}
              </Link>
            ))}
          </nav>
        )}
        <main id="icerik" className="px-4 pb-28 pt-6 sm:px-8 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
        {/* Mobil alt navigasyon */}
        <nav aria-label="Panel alt menü" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0,1fr))` }}>
            {mobileItems.map((i) => (
              <li key={i.href}>
                <Link href={i.href} aria-current={active(i.href) ? 'page' : undefined} className={cn('flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold', active(i.href) ? 'text-neon' : 'text-subtle')}>
                  <i.icon className="size-5" aria-hidden />
                  {i.short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function PanelHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[clamp(1.6rem,1.3rem+1.2vw,2.2rem)] font-semibold">{title}</h1>
        {description && <p className="mt-1.5 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
