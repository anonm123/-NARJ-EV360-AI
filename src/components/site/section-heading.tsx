import { cn } from '@/lib/utils';
import { Reveal } from './reveal';

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-neon', className)}>
      <span aria-hidden className="h-px w-6 bg-gradient-to-r from-transparent to-neon" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <Eyebrow className={align === 'center' ? 'justify-center' : ''}>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 text-[clamp(1.75rem,1.2rem+2.4vw,3rem)] font-semibold text-fg">{title}</h2>
      {description && <p className="mt-4 text-[clamp(1rem,0.95rem+0.3vw,1.15rem)] leading-relaxed text-muted">{description}</p>}
      {children}
    </Reveal>
  );
}
