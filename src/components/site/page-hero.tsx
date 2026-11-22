import { cn } from '@/lib/utils';
import { StatusBadge, type Status } from '@/components/ui/status-badge';
import { Eyebrow } from './section-heading';
import { Reveal } from './reveal';
import { Picture } from './picture';

/**
 * Alt sayfa kahraman bölümü. Her sayfa farklı bir `art` kompozisyonu seçer;
 * böylece bölümler tutarlı ama birbirinin kopyası olmaz.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  status,
  image,
  art,
  actions,
  layout = 'split',
  artOnMobile = true,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  status?: Status[];
  image?: { name: string; alt: string };
  art?: React.ReactNode;
  actions?: React.ReactNode;
  layout?: 'split' | 'backdrop' | 'center';
  /** Araç sayfalarında mobilde görseli gizleyip aracı yukarı taşır. */
  artOnMobile?: boolean;
  className?: string;
}) {
  if (layout === 'backdrop' && image) {
    return (
      <section className={cn('relative isolate flex min-h-[78svh] items-end overflow-hidden pb-14 pt-32 sm:pb-20', className)}>
        <Picture name={image.name} alt={image.alt} priority className="absolute inset-0 -z-20 size-full object-cover" sizes="100vw" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,10,18,0.55)_0%,rgba(5,10,18,0.35)_40%,#050A12_96%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_80%,rgba(5,10,18,0.9),transparent_60%)]" />
        <div className="shell">
          <HeroCopy eyebrow={eyebrow} title={title} description={description} status={status} actions={actions} />
        </div>
      </section>
    );
  }
  if (layout === 'center') {
    return (
      <section className={cn('relative isolate overflow-hidden pb-14 pt-32 sm:pb-20 sm:pt-40', className)}>
        <div aria-hidden className="grid-texture absolute inset-0 -z-10" />
        <div aria-hidden className="absolute left-1/2 top-0 -z-10 h-[520px] w-[min(1100px,140vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,184,255,0.22),transparent)] blur-2xl" />
        <div className="shell text-center">
          <HeroCopy eyebrow={eyebrow} title={title} description={description} status={status} actions={actions} center />
          {art && <Reveal delay={0.15} className={cn('mt-12', !artOnMobile && 'hidden sm:block')}>{art}</Reveal>}
        </div>
      </section>
    );
  }
  return (
    <section className={cn('relative isolate overflow-hidden pb-10 pt-28 sm:pb-16 sm:pt-36', className)}>
      <div aria-hidden className="dot-texture absolute inset-0 -z-10 opacity-40 [mask-image:linear-gradient(180deg,#000,transparent_80%)]" />
      <div aria-hidden className="absolute -right-40 top-10 -z-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(0,229,212,0.16),transparent)] blur-2xl" />
      <div className="shell grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <HeroCopy eyebrow={eyebrow} title={title} description={description} status={status} actions={actions} />
        <div className={cn('min-w-0 animate-rise motion-reduce:animate-none', !artOnMobile && 'hidden sm:block')}>
          {art ??
            (image && (
              <div className="relative overflow-hidden rounded-[28px] border border-line shadow-[var(--shadow-premium)]">
                <Picture name={image.name} alt={image.alt} priority className="aspect-[4/3] w-full object-cover" sizes="(min-width:1024px) 600px, 100vw" />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(5,10,18,0.6))]" />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

function HeroCopy({
  eyebrow,
  title,
  description,
  status,
  actions,
  center,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  status?: Status[];
  actions?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div className={cn('min-w-0 max-w-2xl animate-rise motion-reduce:animate-none', center && 'mx-auto')}>
      <div className={cn('flex flex-wrap items-center gap-3', center && 'justify-center')}>
        <Eyebrow>{eyebrow}</Eyebrow>
        {status?.map((s) => <StatusBadge key={s} status={s} />)}
      </div>
      <h1 className="mt-5 text-[clamp(2.1rem,1.4rem+3.6vw,4.25rem)] font-semibold leading-[1.04] text-fg">{title}</h1>
      <p className="mt-5 text-[clamp(1rem,0.95rem+0.35vw,1.2rem)] leading-relaxed text-muted">{description}</p>
      {actions && <div className={cn('mt-8 flex flex-wrap gap-3', center && 'justify-center')}>{actions}</div>}
    </div>
  );
}
