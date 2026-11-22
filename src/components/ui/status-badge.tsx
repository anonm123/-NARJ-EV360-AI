import { cn } from '@/lib/utils';

export type Status = 'demo' | 'sample' | 'beta' | 'planned' | 'live' | 'model';

const MAP: Record<Status, { label: string; title: string; cls: string; dot: string }> = {
  demo: { label: 'Demo', title: 'Gerçek entegrasyon yok; etkileşimli demo akışı.', cls: 'text-electric border-electric/30 bg-electric/8', dot: 'bg-electric' },
  sample: { label: 'Örnek veri', title: 'Temsili örnek veri; gerçek kaynak değildir.', cls: 'text-warn border-warn/30 bg-warn/8', dot: 'bg-warn' },
  beta: { label: 'Beta', title: 'Çalışan özellik, geliştirme aşamasında.', cls: 'text-violet border-violet/30 bg-violet/10', dot: 'bg-violet' },
  planned: { label: 'Planlı', title: 'Yol haritasında; henüz yayında değil.', cls: 'text-muted border-line-strong bg-white/3', dot: 'bg-muted' },
  live: { label: 'Çalışıyor', title: 'Bu sayfada gerçekten hesaplanır / kaydedilir.', cls: 'text-ok border-ok/30 bg-ok/8', dot: 'bg-ok' },
  model: { label: 'Model', title: 'Varsayımlara dayalı açıklayıcı hesap; tahmin değildir.', cls: 'text-neon border-neon/30 bg-neon/8', dot: 'bg-neon' },
};

export function StatusBadge({ status, className, label }: { status: Status; className?: string; label?: string }) {
  const s = MAP[status];
  return (
    <span
      title={s.title}
      className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]', s.cls, className)}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', s.dot)} />
      {label ?? s.label}
      <span className="sr-only">: {s.title}</span>
    </span>
  );
}

export function Notice({ status = 'demo', children, className }: { status?: Status; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 rounded-2xl border border-line bg-white/[0.02] p-4 text-sm text-muted sm:flex-row sm:items-start sm:gap-3', className)}>
      <StatusBadge status={status} className="self-start" />
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
