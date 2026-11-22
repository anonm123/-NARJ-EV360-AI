'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Menu, X, ArrowRight, LayoutDashboard, LogIn } from 'lucide-react';
import { NAV, LEGAL } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';

export function Navbar({ user }: { user: { name: string } | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(null);
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const enter = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(label);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 140);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background,border-color,backdrop-filter] duration-500',
        scrolled || open ? 'border-b border-line bg-bg/75 backdrop-blur-xl' : 'border-b border-transparent bg-gradient-to-b from-bg/70 to-transparent',
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Logo />

        <nav aria-label="Ana menü" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((g) => (
              <li key={g.label} className="relative" onMouseEnter={() => enter(g.label)} onMouseLeave={leave}>
                <button
                  type="button"
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[0.92rem] font-semibold transition-colors',
                    open === g.label || g.items.some((i) => pathname.startsWith(i.href)) ? 'text-fg' : 'text-muted hover:text-fg',
                  )}
                  aria-expanded={open === g.label}
                  aria-controls={`menu-${g.label}`}
                  onClick={() => setOpen((o) => (o === g.label ? null : g.label))}
                >
                  {g.label}
                  <ChevronDown className={cn('size-4 transition-transform duration-300', open === g.label && 'rotate-180')} aria-hidden />
                </button>
                <AnimatePresence>
                  {open === g.label && (
                    <motion.div
                      id={`menu-${g.label}`}
                      initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-1/2 top-full w-[min(560px,calc(100vw-48px))] -translate-x-1/2 pt-3"
                    >
                      <div className="glass grid grid-cols-2 gap-1 rounded-3xl p-2">
                        {g.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'group flex min-h-11 items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-white/[0.05]',
                              pathname.startsWith(item.href) && 'bg-white/[0.04]',
                            )}
                          >
                            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-bg-2 text-neon transition-colors group-hover:border-neon/40">
                              <item.icon className="size-4" aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-fg">{item.label}</span>
                              <span className="block text-xs leading-snug text-muted">{item.description}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
              <Link href="/panel" prefetch={false}>
                <LayoutDashboard aria-hidden /> Panelim
              </Link>
            </Button>
          ) : (
            <Link href="/giris" className="hidden min-h-11 items-center rounded-full px-4 text-sm font-semibold text-muted transition-colors hover:text-fg sm:inline-flex">
              Giriş
            </Link>
          )}
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href={user ? '/rota' : '/kayit'}>
              {user ? 'Rota Planla' : 'Ücretsiz Başla'} <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" aria-hidden />
            </Link>
          </Button>

          <Dialog.Root open={drawer} onOpenChange={setDrawer}>
            <Dialog.Trigger asChild>
              <button type="button" className="grid size-11 place-items-center rounded-full border border-line bg-surface/60 text-fg lg:hidden" aria-label="Menüyü aç">
                <Menu className="size-5" aria-hidden />
              </button>
            </Dialog.Trigger>
            <AnimatePresence>
              {drawer && (
                <Dialog.Portal forceMount>
                  <Dialog.Overlay asChild forceMount>
                    <motion.div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                  </Dialog.Overlay>
                  <Dialog.Content asChild forceMount>
                    <motion.div
                      initial={reduce ? { opacity: 0 } : { x: '100%' }}
                      animate={reduce ? { opacity: 1 } : { x: 0 }}
                      exit={reduce ? { opacity: 0 } : { x: '100%' }}
                      transition={{ type: 'tween', duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                      className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[420px] flex-col border-l border-line bg-bg pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
                    >
                      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
                        <Dialog.Title className="sr-only">Site menüsü</Dialog.Title>
                        <Dialog.Description className="sr-only">Tüm NAR-J sayfalarına erişin</Dialog.Description>
                        <Logo />
                        <Dialog.Close asChild>
                          <button type="button" className="grid size-11 place-items-center rounded-full border border-line text-fg" aria-label="Menüyü kapat">
                            <X className="size-5" aria-hidden />
                          </button>
                        </Dialog.Close>
                      </div>
                      <nav aria-label="Mobil menü" className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                        {NAV.map((g) => (
                          <div key={g.label} className="mb-5">
                            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-subtle">{g.label}</p>
                            <ul className="space-y-0.5">
                              {g.items.map((item) => (
                                <li key={item.href}>
                                  <Link
                                    href={item.href}
                                    className={cn(
                                      'flex min-h-12 items-center gap-3 rounded-2xl px-2 text-[0.98rem] font-semibold text-fg transition-colors active:bg-white/5',
                                      pathname.startsWith(item.href) && 'bg-white/[0.05]',
                                    )}
                                  >
                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-neon">
                                      <item.icon className="size-4" aria-hidden />
                                    </span>
                                    <span className="min-w-0 truncate">{item.label}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-2 pt-4">
                          {LEGAL.map((l) => (
                            <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center text-sm text-muted">
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      </nav>
                      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-line p-4">
                        {user ? (
                          <Button asChild variant="secondary" className="col-span-2">
                            <Link href="/panel" prefetch={false}>
                              <LayoutDashboard aria-hidden /> Panelim
                            </Link>
                          </Button>
                        ) : (
                          <>
                            <Button asChild variant="secondary">
                              <Link href="/giris">
                                <LogIn aria-hidden /> Giriş
                              </Link>
                            </Button>
                            <Button asChild>
                              <Link href="/kayit">Kayıt Ol</Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </Dialog.Content>
                </Dialog.Portal>
              )}
            </AnimatePresence>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
