import type { MetadataRoute } from 'next';
import { ALL_PAGES, LEGAL } from '@/lib/nav';
import { siteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return ['/', ...ALL_PAGES.map((p) => p.href), ...LEGAL.map((l) => l.href)].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly', priority: p === '/' ? 1 : 0.7 }));
}
