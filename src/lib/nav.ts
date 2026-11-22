import type { LucideIcon } from 'lucide-react';
import {
  Map, Route, Calculator, CarFront, CalendarClock, Bot, Smartphone, Scale, CreditCard, Truck, Leaf, Handshake,
  Gem, TrendingUp, Compass, Mail,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: 'Platform',
    items: [
      { href: '/harita', label: 'Şarj Haritası', description: 'Türkiye geneli istasyon keşfi ve filtreler', icon: Map },
      { href: '/rota', label: 'AI Rota Planlayıcı', description: 'Enerji optimizasyonlu yolculuk planı', icon: Route },
      { href: '/hesaplayici', label: 'Maliyet & Süre', description: 'Şarj maliyeti ve süre hesaplayıcısı', icon: Calculator },
      { href: '/garaj', label: 'Araç Garajı', description: 'Araç profilleri ve kullanıcı profili', icon: CarFront },
      { href: '/rezervasyon', label: 'Rezervasyon', description: 'Şarj noktası ayırma akışı', icon: CalendarClock },
      { href: '/asistan', label: 'NAR-J AI Asistan', description: 'Sorularınızı yanıtlayan yardımcı', icon: Bot },
      { href: '/mobil', label: 'Mobil Uygulama', description: 'Uygulama deneyimi önizlemesi', icon: Smartphone },
    ],
  },
  {
    label: 'Çözümler',
    items: [
      { href: '/operatorler', label: 'Operatör Karşılaştırma', description: 'Tarife ve hizmet karşılaştırması', icon: Scale },
      { href: '/rfid', label: 'RFID & Tek Ödeme', description: 'Tek kart, tek cüzdan vizyonu', icon: CreditCard },
      { href: '/filo', label: 'Filo & Lojistik', description: 'Akıllı filo enerji yönetimi', icon: Truck },
      { href: '/analitik', label: 'Karbon & Enerji', description: 'Emisyon ve enerji analitiği', icon: Leaf },
      { href: '/is-ortakligi', label: 'İş Ortaklığı & API', description: 'Operatör çözümleri ve adaptörler', icon: Handshake },
    ],
  },
  {
    label: 'Şirket',
    items: [
      { href: '/abonelik', label: 'Abonelik & SaaS', description: 'Bireysel ve kurumsal planlar', icon: Gem },
      { href: '/yatirimci', label: 'Yatırımcı İlişkileri', description: 'İş modeli ve gelir senaryoları', icon: TrendingUp },
      { href: '/hakkimizda', label: 'Hakkımızda & Yol Haritası', description: 'Misyon, teknoloji ve hedefler', icon: Compass },
      { href: '/iletisim', label: 'Erken Erişim', description: 'Bekleme listesi ve iletişim', icon: Mail },
    ],
  },
];

export const LEGAL = [
  { href: '/yasal/gizlilik', label: 'Gizlilik Politikası' },
  { href: '/yasal/kvkk', label: 'KVKK Aydınlatma Metni' },
  { href: '/yasal/kullanim-kosullari', label: 'Kullanım Koşulları' },
];

export const ALL_PAGES = NAV.flatMap((g) => g.items);
