import { cn } from '@/lib/utils';

/**
 * Optimize edilmiş görsel: AVIF → WebP → JPG fallback, responsive srcset.
 * Dosyalar scripts/render-images.mjs ile üretilir (public/images).
 * `fallback` arka planı, görsel yüklenemese bile şık bir degrade gösterir.
 */
const SIZES: Record<string, number[]> = {
  'hero-ev-night': [960, 1600, 2560],
  'hero-ev-night-portrait': [720, 1080],
  'charging-station': [900, 1600],
  'fleet-highway': [1200, 2400],
  'smart-city-grid': [1000, 2000],
  'battery-pack': [900, 1800],
  'rfid-pass': [900, 1600],
};

const src = (name: string, w: number, ext: string) => {
  const widths = SIZES[name] ?? [];
  return w === widths[widths.length - 1] ? `/images/${name}.${ext}` : `/images/${name}-${w}.${ext}`;
};

export function Picture({
  name,
  alt,
  className,
  sizes = '100vw',
  priority = false,
  portrait,
}: {
  name: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  portrait?: string; // mobil için ayrı kompozisyon
}) {
  const widths = SIZES[name] ?? [];
  const set = (n: string, ext: string) => (SIZES[n] ?? []).map((w) => `${src(n, w, ext)} ${w}w`).join(', ');
  return (
    <picture>
      {portrait && <source media="(max-width: 640px) and (orientation: portrait)" type="image/avif" srcSet={set(portrait, 'avif')} sizes="100vw" />}
      {portrait && <source media="(max-width: 640px) and (orientation: portrait)" type="image/webp" srcSet={set(portrait, 'webp')} sizes="100vw" />}
      <source type="image/avif" srcSet={set(name, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set(name, 'webp')} sizes={sizes} />
      <img
        src={`/images/${name}.jpg`}
        alt={alt}
        width={widths[widths.length - 1]}
        className={cn('bg-[radial-gradient(ellipse_at_60%_40%,#0f2a3d,#050A12_70%)]', className)}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    </picture>
  );
}
