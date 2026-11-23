'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/panel/yonetim', label: 'Genel bakış' },
  { href: '/panel/yonetim/kullanicilar', label: 'Kullanıcılar' },
  { href: '/panel/yonetim/talepler', label: 'Erken erişim' },
  { href: '/panel/yonetim/sistem', label: 'Sistem & kayıtlar' },
];

export function AdminTabs() {
  const path = usePathname();
  const active = (h: string) => (h === '/panel/yonetim' ? path === h : path.startsWith(h));
  return (
    <nav aria-label="Yönetim bölümleri" className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={active(t.href) ? 'page' : undefined}
          className={cn('inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors', active(t.href) ? 'border-neon/50 bg-neon/10 text-fg' : 'border-line text-muted hover:text-fg')}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
