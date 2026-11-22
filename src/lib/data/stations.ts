/**
 * ÖRNEK istasyon veri seti.
 * Bu noktalar gerçek şarj istasyonları DEĞİLDİR; il merkezleri çevresinde deterministik olarak üretilmiş
 * temsili konumlardır. Doluluk durumu simülasyondur. Gerçek veri, operatör API adaptörleri (OCPI) bağlandığında
 * `src/lib/adapters` üzerinden gelecektir.
 */
import { CITIES } from './cities';
import { SAMPLE_OPERATORS } from './operators';

export type Connector = 'CCS2' | 'Type 2' | 'CHAdeMO';
export type DemoStatus = 'available' | 'busy' | 'offline';
export type SiteType = 'AVM' | 'Otoyol' | 'Otopark' | 'Otel' | 'Şehir merkezi';

export interface Station {
  id: string;
  name: string;
  cityId: string;
  city: string;
  lat: number;
  lng: number;
  operatorId: string;
  operator: string;
  connectors: Connector[];
  maxKw: number;
  points: number;
  site: SiteType;
  demoStatus: DemoStatus;
  pricePerKwh: number;
  open24h: boolean;
}

let s = 20260;
const rnd = () => {
  s = (s * 48271) % 2147483647;
  return s / 2147483647;
};

const SITES: SiteType[] = ['AVM', 'Otoyol', 'Otopark', 'Otel', 'Şehir merkezi'];
const POWERS = [22, 60, 120, 180, 300];
const BIG = new Set(['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'kocaeli']);

function build(): Station[] {
  const out: Station[] = [];
  for (const c of CITIES) {
    const n = BIG.has(c.id) ? 6 : 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const op = SAMPLE_OPERATORS[Math.floor(rnd() * SAMPLE_OPERATORS.length)];
      const maxKw = POWERS[Math.floor(rnd() * POWERS.length)];
      const dc = maxKw > 22;
      const connectors: Connector[] = dc ? (rnd() < 0.25 ? ['CCS2', 'CHAdeMO'] : ['CCS2']) : ['Type 2'];
      if (dc && rnd() < 0.4) connectors.push('Type 2');
      const r = rnd();
      out.push({
        id: `${c.id}-${i + 1}`,
        name: `${c.name} Örnek Nokta ${i + 1}`,
        cityId: c.id,
        city: c.name,
        lat: +(c.lat + (rnd() - 0.5) * (BIG.has(c.id) ? 0.22 : 0.12)).toFixed(4),
        lng: +(c.lng + (rnd() - 0.5) * (BIG.has(c.id) ? 0.3 : 0.16)).toFixed(4),
        operatorId: op.id,
        operator: op.name,
        connectors,
        maxKw,
        points: dc ? 2 + Math.floor(rnd() * 6) : 2 + Math.floor(rnd() * 4),
        site: SITES[Math.floor(rnd() * SITES.length)],
        demoStatus: r < 0.62 ? 'available' : r < 0.9 ? 'busy' : 'offline',
        pricePerKwh: dc ? op.dcPrice : op.acPrice,
        open24h: rnd() < 0.7,
      });
    }
  }
  return out;
}

export const SAMPLE_STATIONS: Station[] = build();

export const STATUS_LABEL: Record<DemoStatus, string> = {
  available: 'Müsait (simülasyon)',
  busy: 'Dolu (simülasyon)',
  offline: 'Bakımda (simülasyon)',
};
