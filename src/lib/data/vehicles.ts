/**
 * Segment bazlı araç profilleri. Bunlar belirli bir markanın/modelin resmi verisi DEĞİLDİR;
 * segment ortalamalarını temsil eden, hesaplama için kullanılan şablonlardır.
 * Kullanıcılar panelden kendi araçlarını gerçek değerleriyle ekleyebilir.
 */
export interface VehicleProfile {
  id: string;
  name: string;
  segment: string;
  batteryKwh: number; // kullanılabilir kapasite
  consumptionKwhPer100: number; // karma kullanım
  maxDcKw: number;
  maxAcKw: number;
  accent: string;
}

export const VEHICLE_PROFILES: VehicleProfile[] = [
  { id: 'sehir-mini', name: 'Şehir İçi Mini', segment: 'A/B segment', batteryKwh: 37, consumptionKwhPer100: 13.5, maxDcKw: 50, maxAcKw: 7.4, accent: '#00E5D4' },
  { id: 'kompakt-hatch', name: 'Kompakt Hatchback', segment: 'C segment', batteryKwh: 52, consumptionKwhPer100: 15.5, maxDcKw: 100, maxAcKw: 11, accent: '#00B8FF' },
  { id: 'kompakt-suv', name: 'Kompakt SUV', segment: 'C-SUV', batteryKwh: 64, consumptionKwhPer100: 17, maxDcKw: 130, maxAcKw: 11, accent: '#2EE6A6' },
  { id: 'orta-sedan', name: 'Aerodinamik Sedan', segment: 'D segment', batteryKwh: 75, consumptionKwhPer100: 15, maxDcKw: 170, maxAcKw: 11, accent: '#8B7BFF' },
  { id: 'buyuk-suv', name: 'Büyük SUV', segment: 'E-SUV', batteryKwh: 95, consumptionKwhPer100: 21, maxDcKw: 200, maxAcKw: 11, accent: '#FFB547' },
  { id: 'performans', name: 'Performans Fastback', segment: 'Premium GT', batteryKwh: 90, consumptionKwhPer100: 18.5, maxDcKw: 250, maxAcKw: 22, accent: '#FF5A6E' },
  { id: 'hafif-ticari', name: 'Hafif Ticari Van', segment: 'LCV', batteryKwh: 68, consumptionKwhPer100: 24, maxDcKw: 100, maxAcKw: 11, accent: '#9AAFC5' },
];

export const vehicleById = (id: string) => VEHICLE_PROFILES.find((v) => v.id === id);

export const estimatedRangeKm = (v: Pick<VehicleProfile, 'batteryKwh' | 'consumptionKwhPer100'>) =>
  (v.batteryKwh / v.consumptionKwhPer100) * 100;
