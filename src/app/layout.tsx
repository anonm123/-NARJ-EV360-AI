import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { siteUrl } from '@/lib/site-url';

// Değişken fontlar (SIL OFL) — yerel olarak barındırılır; next/font ölçü uyumlu yedek font üreterek CLS'yi önler.
// Latin ve Latin-Ext (ğ, ş, ı, İ) ayrı dosyalardır; font-family zincirinde ikisi birlikte kullanılır.
const manrope = localFont({ src: '../fonts/manrope-latin-wght-normal.woff2', weight: '200 800', variable: '--font-manrope', display: 'swap' });
const manropeExt = localFont({ src: '../fonts/manrope-latin-ext-wght-normal.woff2', weight: '200 800', variable: '--font-manrope-ext', display: 'swap', preload: false });
const grotesk = localFont({ src: '../fonts/space-grotesk-latin-wght-normal.woff2', weight: '300 700', variable: '--font-grotesk', display: 'swap' });
const groteskExt = localFont({ src: '../fonts/space-grotesk-latin-ext-wght-normal.woff2', weight: '300 700', variable: '--font-grotesk-ext', display: 'swap', preload: false });

const SITE_URL = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'NAR-J EV360-AI · Yolun Akıllı Gücü', template: '%s · NAR-J EV360-AI' },
  description:
    'Yapay zekâ destekli elektrikli araç şarjı, rota optimizasyonu, enerji yönetimi ve filo SaaS platformu. Şarj haritası, maliyet hesaplayıcı, AI rota planlayıcı ve kurumsal filo paneli.',
  applicationName: 'NAR-J EV360-AI',
  keywords: ['elektrikli araç', 'şarj istasyonu', 'EV rota planlama', 'filo yönetimi', 'şarj maliyeti hesaplama', 'Türkiye'],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'NAR-J EV360-AI',
    title: 'NAR-J EV360-AI · Yolun Akıllı Gücü',
    description: 'Elektrikli mobilite için yapay zekâ destekli şarj, rota ve enerji platformu.',
    images: [{ url: '/images/hero-ev-night.jpg', width: 960, alt: 'Gece şarj istasyonunda elektrikli otomobil' }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#050A12',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`bg-bg ${manrope.variable} ${manropeExt.variable} ${grotesk.variable} ${groteskExt.variable}`}>
      <body className="bg-bg text-fg antialiased">
        <a href="#icerik" className="sr-only z-[100] rounded-full bg-neon px-4 py-2 font-semibold text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          İçeriğe geç
        </a>
        {children}
      </body>
    </html>
  );
}
