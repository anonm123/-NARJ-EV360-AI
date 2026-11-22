/**
 * ÖRNEK operatör profilleri — anonimleştirilmiştir (Operatör A–E).
 * NAR-J henüz herhangi bir şarj operatörüyle resmi iş ortaklığına sahip değildir.
 * Tarifeler 2026 piyasa aralığını temsil eden varsayımlardır; kullanıcı arayüzde değiştirebilir.
 */
export interface SampleOperator {
  id: string;
  name: string;
  profile: string;
  acPrice: number; // ₺/kWh
  dcPrice: number; // ₺/kWh
  hpcPrice: number; // ₺/kWh (150 kW+)
  sessionFee: number; // ₺
  idleFeePerMin: number; // ₺/dk
  maxKw: number;
  coverage: 'Ulusal' | 'Bölgesel' | 'Otoyol odaklı' | 'Şehir içi';
  rfid: boolean;
  app: boolean;
  reservation: boolean;
  roaming: boolean;
  color: string;
}

export const SAMPLE_OPERATORS: SampleOperator[] = [
  { id: 'op-a', name: 'Operatör A', profile: 'Geniş ulusal ağ, AVM ve otopark ağırlıklı', acPrice: 9.9, dcPrice: 13.9, hpcPrice: 15.9, sessionFee: 0, idleFeePerMin: 2, maxKw: 180, coverage: 'Ulusal', rfid: true, app: true, reservation: false, roaming: true, color: '#00B8FF' },
  { id: 'op-b', name: 'Operatör B', profile: 'Otoyol koridorlarında yüksek güçlü istasyonlar', acPrice: 10.5, dcPrice: 14.5, hpcPrice: 16.4, sessionFee: 0, idleFeePerMin: 3, maxKw: 300, coverage: 'Otoyol odaklı', rfid: true, app: true, reservation: true, roaming: true, color: '#00E5D4' },
  { id: 'op-c', name: 'Operatör C', profile: 'Şehir içi AC ağırlıklı, uygun fiyat', acPrice: 8.6, dcPrice: 12.9, hpcPrice: 14.9, sessionFee: 5, idleFeePerMin: 1, maxKw: 120, coverage: 'Şehir içi', rfid: false, app: true, reservation: false, roaming: false, color: '#2EE6A6' },
  { id: 'op-d', name: 'Operatör D', profile: 'Bölgesel ağ, otel ve turizm noktaları', acPrice: 9.4, dcPrice: 13.4, hpcPrice: 15.2, sessionFee: 0, idleFeePerMin: 2, maxKw: 150, coverage: 'Bölgesel', rfid: true, app: true, reservation: true, roaming: false, color: '#8B7BFF' },
  { id: 'op-e', name: 'Operatör E', profile: 'Premium HPC lokasyonları, lounge hizmeti', acPrice: 11.2, dcPrice: 15.2, hpcPrice: 17.5, sessionFee: 0, idleFeePerMin: 4, maxKw: 350, coverage: 'Ulusal', rfid: true, app: true, reservation: true, roaming: true, color: '#FFB547' },
];

export const operatorById = (id: string) => SAMPLE_OPERATORS.find((o) => o.id === id);

/** Bir şarj oturumunun toplam maliyeti (oturum ücreti + enerji + bekleme). */
export function sessionCost(op: SampleOperator, kwh: number, tier: 'ac' | 'dc' | 'hpc', idleMinutes = 0) {
  const price = tier === 'ac' ? op.acPrice : tier === 'dc' ? op.dcPrice : op.hpcPrice;
  return op.sessionFee + kwh * price + Math.max(0, idleMinutes) * op.idleFeePerMin;
}
