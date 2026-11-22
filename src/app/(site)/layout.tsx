import { Footer } from '@/components/site/footer';
import { SiteNavbar } from '@/components/site/site-navbar';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNavbar />
      <main id="icerik" className="min-h-[70vh]">
        {children}
      </main>
      <Footer />
    </>
  );
}
