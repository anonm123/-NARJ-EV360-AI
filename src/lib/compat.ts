import { toggById } from './data/togg';

/**
 * Şarj istasyonu ↔ araç soket uyumluluğu (web ve mobilde aynı kural). Togg sürümleri CCS2 (DC) ve Type 2 (AC) kullanır
 * (Türkiye/AB standardı; Togg kaynağında sürüm bazında ayrıca teyit edilmedi — togg.ts SOCKETS notu).
 */
const SUPPORTED = ['CCS2', 'Type 2'];

export function socketCompat(vehicleId: string, stationConnectors: string[]) {
  const v = toggById(vehicleId);
  const ok = stationConnectors.filter((c) => SUPPORTED.includes(c));
  return {
    vehicleName: v?.name ?? 'Aracınız',
    compatible: ok.length > 0,
    fast: ok.includes('CCS2'),
    usable: ok,
    unusable: stationConnectors.filter((c) => !SUPPORTED.includes(c)),
  };
}
