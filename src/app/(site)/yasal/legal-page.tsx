export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="shell max-w-3xl pb-10 pt-28 sm:pt-36">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neon">Yasal</p>
      <h1 className="mt-4 text-[clamp(2rem,1.5rem+2vw,3rem)] font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-subtle">Son güncelleme: {updated} · Taslak metin — yayın öncesi hukuk danışmanı tarafından gözden geçirilmelidir.</p>
      <div className="mt-10 space-y-6 text-[0.98rem] leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">{children}</div>
    </article>
  );
}
