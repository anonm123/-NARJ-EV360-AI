import type { MetadataRoute } from 'next';
import { ALL_PAGES, LEGAL } from '@/lib/nav';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return ['/', ...ALL_PAGES.map((p) => p.href), ...LEGAL.map((l) => l.href)].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly', priority: p === '/' ? 1 : 0.7 }));
}
