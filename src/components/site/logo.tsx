import Link from 'next/link';
import { cn } from '@/lib/utils';

/** NAR-J özgün logo işareti: 360° yörünge halkası içinde enerji şimşeği formunda "N". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('size-9', className)} aria-hidden>
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00B8FF" />
          <stop offset="1" stopColor="#00E5D4" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="17.5" fill="none" stroke="url(#lm-g)" strokeWidth="1.6" strokeDasharray="88 22" strokeLinecap="round" transform="rotate(-50 20 20)" />
      <circle cx="20" cy="20" r="13" fill="#0D1624" stroke="rgba(154,175,197,0.25)" />
      <path d="M14 27V13l7.2 9.2V13H26v14l-7.2-9.2V27z" fill="url(#lm-g)" />
      <circle cx="33.6" cy="9.6" r="2" fill="#00E5D4" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn('group inline-flex min-h-11 items-center gap-2.5 rounded-lg', className)} aria-label={compact ? 'NAR-J EV360-AI ana sayfa' : undefined}>
      <LogoMark className="transition-transform duration-500 group-hover:rotate-[20deg]" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.05rem] font-bold tracking-tight text-fg">
            NAR-J <span className="text-electric-gradient">EV360-AI</span>
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-subtle">Yolun Akıllı Gücü</span>
        </span>
      )}
    </Link>
  );
}
