/**
 * Sitenin kanonik adresi (OG, sitemap, robots için).
 * Öncelik: NEXT_PUBLIC_SITE_URL → Render'ın verdiği adres → Vercel üretim adresi → yerel.
 */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}
