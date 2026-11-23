/**
 * Gerçek karayolu rotası üzerinde EV enerji ve şarj planı.
 *  - Mesafe ve süre routing motorundan (OSRM) gelir; kuş uçuşu mesafe kullanılmaz.
 *  - Tüketim düzeltmesi yalnızca verisi olan etkenler için yapılır: kullanıcının girdiği dış sıcaklık ve
 *    routing motorunun verdiği ortalama hız. Rakım verisi yoktur → düzeltme yapılmaz (raporda belirtilir).
 *  - Şarj durakları, verilen `findStation` fonksiyonuyla GERÇEK istasyon verisinden seçilir; bulunamazsa
 *    plan uydurulmaz, açıklayıcı hata döner.
 */
import { computeCharge } from './charging';

export interface TripVehicle {
  batteryKwh: number;
  consumptionKwhPer100: number;
  maxDcKw: number;
}

export interface TripInput {
  distanceKm: number;
  durationMin: number;
  vehicle: TripVehicle;
  startSoc: number;
  reserveSoc: number; // yolculuk boyunca ve varışta altına inilmeyecek seviye
  targetSoc: number; // duraklarda şarj edilecek üst seviye
  tempC?: number | null; // bilinmiyorsa null → sıcaklık düzeltmesi yok
  pricePerKwh?: number | null; // kullanıcı girdisi; yoksa maliyet hesaplanmaz
  assumedChargerKw?: number; // istasyon gücü bilinmiyorsa varsayım (etiketlenir)
}

export interface FoundStation {
  id: string;
  name: string | null;
  km: number; // rota üzerindeki konum
  offRouteKm: number;
  maxPowerKw: number | null;
  lat: number;
  lng: number;
}

/** Rota üzerinde [minKm, maxKm] aralığında, mümkün olan en ileri DC istasyonu döndürür; yoksa null. */
export type StationFinder = (minKm: number, maxKm: number) => Promise<FoundStation | null>;

export interface TripStop {
  station: FoundStation;
  arriveSoc: number;
  departSoc: number;
  energyKwh: number;
  chargeMinutes: number;
  powerAssumed: boolean;
  cost: number | null;
}

export interface TripPlan {
  distanceKm: number;
  driveMinutes: number;
  chargeMinutes: number;
  totalMinutes: number;
  consumptionKwhPer100: number;
  corrections: string[];
  energyKwh: number;
  arrivalSoc: number;
  stops: TripStop[];
  totalCost: number | null;
  socProfile: { km: number; soc: number }[];
}

export class TripError extends Error {
  constructor(message: string, readonly atKm?: number) {
    super(message);
  }
}

export function adjustedConsumption(base: number, avgSpeedKmh: number | null, tempC: number | null | undefined) {
  const corrections: string[] = [];
  let f = 1;
  if (avgSpeedKmh != null && avgSpeedKmh > 90) {
    const s = (avgSpeedKmh - 90) * 0.008;
    f += s;
    corrections.push(`Ortalama hız ${Math.round(avgSpeedKmh)} km/s (routing) → +%${Math.round(s * 100)}`);
  }
  if (tempC != null && Number.isFinite(tempC)) {
    if (tempC < 10) {
      const c = (10 - tempC) * 0.012;
      f += c;
      corrections.push(`Dış sıcaklık ${tempC}°C (kullanıcı) → +%${Math.round(c * 100)}`);
    } else if (tempC > 30) {
      const c = (tempC - 30) * 0.01;
      f += c;
      corrections.push(`Dış sıcaklık ${tempC}°C (kullanıcı) → +%${Math.round(c * 100)}`);
    }
  }
  corrections.push('Rakım verisi yok → eğim düzeltmesi yapılmadı');
  return { value: base * f, corrections };
}

const BUFFER = 3; // % — durağa varışta rezervin üzerinde bırakılan güvenlik payı

export async function planTrip(input: TripInput, findStation: StationFinder): Promise<TripPlan> {
  const v = input.vehicle;
  if (!(input.distanceKm > 0)) throw new TripError('Rota mesafesi geçersiz.');
  if (input.startSoc <= input.reserveSoc) throw new TripError('Başlangıç şarjı güvenlik rezervinden yüksek olmalı.');
  if (input.targetSoc <= input.reserveSoc + BUFFER) throw new TripError('Hedef şarj, rezervden en az %5 yüksek olmalı.');
  const avgSpeed = input.durationMin > 0 ? input.distanceKm / (input.durationMin / 60) : null;
  const { value: cons, corrections } = adjustedConsumption(v.consumptionKwhPer100, avgSpeed, input.tempC);
  const socPerKm = (cons / 100 / v.batteryKwh) * 100;
  const D = input.distanceKm;

  let pos = 0;
  let soc = input.startSoc;
  const stops: TripStop[] = [];
  const profile = [{ km: 0, soc: +soc.toFixed(1) }];
  let chargeMinutes = 0;
  let totalCost: number | null = input.pricePerKwh != null ? 0 : null;

  for (let guard = 0; guard < 25; guard++) {
    const needToFinish = (D - pos) * socPerKm + input.reserveSoc;
    if (soc >= needToFinish) {
      soc -= (D - pos) * socPerKm;
      profile.push({ km: +D.toFixed(1), soc: +soc.toFixed(1) });
      break;
    }
    const reachKm = pos + (soc - input.reserveSoc - BUFFER) / socPerKm;
    if (reachKm <= pos + 1) throw new TripError('Mevcut şarjla bir sonraki şarj noktasına ulaşılamıyor.', pos);
    const station = await findStation(pos + 1, Math.min(reachKm, D));
    if (!station) {
      throw new TripError(
        `${Math.round(pos)}–${Math.round(Math.min(reachKm, D))}. km arasında veri kaynaklarında uygun DC şarj istasyonu bulunamadı. Daha yüksek başlangıç şarjı veya ara durak deneyin.`,
        pos,
      );
    }
    soc -= (station.km - pos) * socPerKm;
    pos = station.km;
    profile.push({ km: +pos.toFixed(1), soc: +soc.toFixed(1) });
    const needAfter = (D - pos) * socPerKm + input.reserveSoc + 2;
    const departSoc = Math.min(100, Math.max(soc + 5, Math.min(input.targetSoc, needAfter)));
    const powerAssumed = station.maxPowerKw == null;
    const chargerKw = station.maxPowerKw ?? input.assumedChargerKw ?? 50;
    const c = computeCharge({ batteryKwh: v.batteryKwh, startSoc: soc, targetSoc: departSoc, chargerKw, vehicleMaxKw: v.maxDcKw, type: 'DC', pricePerKwh: input.pricePerKwh ?? 0, consumptionKwhPer100: cons });
    const cost = input.pricePerKwh != null ? c.cost : null;
    stops.push({ station, arriveSoc: soc, departSoc, energyKwh: c.energyFromGridKwh, chargeMinutes: c.minutes, powerAssumed, cost });
    chargeMinutes += c.minutes;
    if (totalCost != null && cost != null) totalCost += cost;
    soc = departSoc;
    profile.push({ km: +pos.toFixed(1), soc: +soc.toFixed(1) });
  }

  return {
    distanceKm: D,
    driveMinutes: input.durationMin,
    chargeMinutes,
    totalMinutes: input.durationMin + chargeMinutes,
    consumptionKwhPer100: cons,
    corrections,
    energyKwh: (D * cons) / 100,
    arrivalSoc: soc,
    stops,
    totalCost,
    socProfile: profile,
  };
}
