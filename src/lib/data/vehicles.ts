/**
 * Hesap motorlarının kullandığı araç profilleri — YALNIZCA Togg sürümlerinden türetilir (src/lib/data/togg.ts).
 * Her değerin resmî/tahmini durumu ve kaynağı togg.ts içinde tutulur; burada yalnızca hesaplamaya gereken sayılar vardır.
 * Kullanıcılar panelden kendi araçlarını gerçek değerleriyle ayrıca ekleyebilir.
 */
import { consumptionFor, DEFAULT_TOGG_ID, TOGG_VERSIONS, type ToggVersion } from './togg';

export interface VehicleProfile {
  id: string;
  name: string;
  segment: string;
  batteryKwh: number; // hesapta kullanılan kapasite
  consumptionKwhPer100: number; // karma kullanım
  maxDcKw: number;
  maxAcKw: number;
  accent: string;
}

const ACCENT: Record<string, string> = { RWD: '#00E5D4', AWD: '#00B8FF' };

export const profileFromTogg = (v: ToggVersion): VehicleProfile => ({
  id: v.id,
  name: v.name,
  segment: `Togg ${v.model} · ${v.body}`,
  batteryKwh: v.specs.batteryKwh.value ?? 54.6,
  consumptionKwhPer100: consumptionFor(v).value ?? 19.7,
  maxDcKw: v.specs.maxDcKw.value ?? 180,
  maxAcKw: v.specs.maxAcKw.value ?? 22,
  accent: ACCENT[v.drive],
});

export const VEHICLE_PROFILES: VehicleProfile[] = TOGG_VERSIONS.map(profileFromTogg);

export const DEFAULT_VEHICLE_ID = DEFAULT_TOGG_ID;

export const vehicleById = (id: string) => VEHICLE_PROFILES.find((v) => v.id === id);

export const estimatedRangeKm = (v: Pick<VehicleProfile, 'batteryKwh' | 'consumptionKwhPer100'>) =>
  (v.batteryKwh / v.consumptionKwhPer100) * 100;
