/**
 * AI rota & enerji optimizasyonu (kural tabanlı simülasyon).
 * Gerçek trafik / yükseklik verisi bağlanana kadar mesafe kuş uçuşu × yol katsayısı ile tahmin edilir.
 */
import { computeCharge } from './charging';
import { CITIES, estimateRoadKm, nearestCity, type City } from '../data/cities';
import { CARBON_DEFAULTS } from './carbon';

export type RouteMode = 'fastest' | 'cheapest' | 'balanced';

export interface RouteInput {
  from: City;
  to: City;
  batteryKwh: number;
  consumptionKwhPer100: number; // 100 km/s referans hızında
  maxDcKw: number;
  startSoc: number;
  arrivalMinSoc: number;
  reserveSoc?: number; // yolculuk sırasında altına inilmeyecek seviye
  mode: RouteMode;
  speedKmh: number;
  tempC: number;
  dcPricePerKwh: number;
  iceLitersPer100?: number;
  fuelPricePerLiter?: number;
}

export interface ChargeStop {
  index: number;
  km: number;
  lat: number;
  lng: number;
  nearCity: string;
  socIn: number;
  socOut: number;
  energyKwh: number;
  minutes: number;
  cost: number;
  chargerKw: number;
}

export interface RoutePlan {
  distanceKm: number;
  adjustedConsumption: number;
  driveMinutes: number;
  chargeMinutes: number;
  totalMinutes: number;
  totalCost: number;
  energyKwh: number;
  arrivalSoc: number;
  stops: ChargeStop[];
  socProfile: { km: number; soc: number }[];
  co2SavedKg: number;
  iceCost: number;
  path: { lat: number; lng: number }[];
}

const MODE_SETTINGS: Record<RouteMode, { targetSoc: number; chargerKw: number; priceFactor: number; bufferSoc: number }> = {
  fastest: { targetSoc: 75, chargerKw: 300, priceFactor: 1.08, bufferSoc: 3 },
  balanced: { targetSoc: 80, chargerKw: 180, priceFactor: 1, bufferSoc: 5 },
  cheapest: { targetSoc: 90, chargerKw: 60, priceFactor: 0.82, bufferSoc: 5 },
};

/** Hız ve sıcaklığa göre tüketim düzeltmesi. */
export function adjustConsumption(base: number, speedKmh: number, tempC: number) {
  let f = 1 + (speedKmh - 100) * 0.008;
  if (tempC < 10) f += (10 - tempC) * 0.012;
  if (tempC > 30) f += (tempC - 30) * 0.01;
  return base * Math.max(0.6, f);
}

function interpolate(a: City, b: City, t: number) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

export function planRoute(input: RouteInput): RoutePlan {
  if (input.from.id === input.to.id) throw new RangeError('Başlangıç ve varış aynı olamaz.');
  if (input.startSoc <= 0 || input.startSoc > 100) throw new RangeError('Başlangıç şarjı %1–100 olmalı.');
  if (input.arrivalMinSoc < 0 || input.arrivalMinSoc > 80) throw new RangeError('Varış şarjı %0–80 olmalı.');
  const reserve = input.reserveSoc ?? 10;
  const mode = MODE_SETTINGS[input.mode];
  const distanceKm = estimateRoadKm(input.from, input.to);
  const cons = adjustConsumption(input.consumptionKwhPer100, input.speedKmh, input.tempC);
  const kwhPerKm = cons / 100;
  const socPerKm = (kwhPerKm / input.batteryKwh) * 100;
  const minLegSoc = Math.max(reserve, 5);

  let pos = 0;
  let soc = input.startSoc;
  const stops: ChargeStop[] = [];
  const socProfile = [{ km: 0, soc: +soc.toFixed(1) }];
  let chargeMinutes = 0;
  let totalCost = 0;

  for (let guard = 0; guard < 30; guard++) {
    const remaining = distanceKm - pos;
    const socNeededToFinish = remaining * socPerKm + input.arrivalMinSoc;
    if (soc >= socNeededToFinish) {
      pos = distanceKm;
      soc -= remaining * socPerKm;
      socProfile.push({ km: +distanceKm.toFixed(1), soc: +soc.toFixed(1) });
      break;
    }
    // Bir sonraki durağa kadar gidilebilecek mesafe (rezerv + güvenlik payı korunarak)
    const legKm = (soc - (minLegSoc + mode.bufferSoc)) / socPerKm;
    if (legKm <= 1) {
      if (stops.length === 0 && pos === 0) throw new RangeError('Başlangıç şarjı ilk şarj noktasına ulaşmak için yetersiz.');
      throw new RangeError('Rota bu araç profiliyle planlanamadı.');
    }
    pos += legKm;
    soc -= legKm * socPerKm;
    socProfile.push({ km: +pos.toFixed(1), soc: +soc.toFixed(1) });

    // Kalan yolu bitirmek için gereken kadar şarj et (mod hedefi ile sınırlı)
    const need = (distanceKm - pos) * socPerKm + input.arrivalMinSoc + 2;
    // Son durakta yalnızca gereken kadar, ara duraklarda mod hedefine kadar şarj
    const target = need <= mode.targetSoc ? need : mode.targetSoc;
    const finalTarget = Math.min(100, Math.max(target, soc + 5));
    const charge = computeCharge({
      batteryKwh: input.batteryKwh,
      startSoc: soc,
      targetSoc: finalTarget,
      chargerKw: mode.chargerKw,
      vehicleMaxKw: input.maxDcKw,
      type: 'DC',
      pricePerKwh: input.dcPricePerKwh * mode.priceFactor,
      consumptionKwhPer100: cons,
    });
    const t = pos / distanceKm;
    const pt = interpolate(input.from, input.to, t);
    stops.push({
      index: stops.length + 1,
      km: pos,
      ...pt,
      nearCity: nearestCity(pt).city.name,
      socIn: soc,
      socOut: finalTarget,
      energyKwh: charge.energyFromGridKwh,
      minutes: charge.minutes + 4, // bağlanma / ödeme payı
      cost: charge.cost,
      chargerKw: Math.min(mode.chargerKw, input.maxDcKw),
    });
    chargeMinutes += charge.minutes + 4;
    totalCost += charge.cost;
    soc = finalTarget;
    socProfile.push({ km: +pos.toFixed(1), soc: +soc.toFixed(1) });
  }

  const driveMinutes = (distanceKm / input.speedKmh) * 60;
  const energyKwh = distanceKm * kwhPerKm;
  const iceLiters = (distanceKm / 100) * (input.iceLitersPer100 ?? 6.5);
  const co2SavedKg = iceLiters * CARBON_DEFAULTS.gasolineKgPerLiter - (energyKwh / 0.92) * CARBON_DEFAULTS.gridKgPerKwh;

  return {
    distanceKm,
    adjustedConsumption: cons,
    driveMinutes,
    chargeMinutes,
    totalMinutes: driveMinutes + chargeMinutes,
    totalCost,
    energyKwh,
    arrivalSoc: soc,
    stops,
    socProfile,
    co2SavedKg,
    iceCost: iceLiters * (input.fuelPricePerLiter ?? 50),
    path: [input.from, ...stops.map((s) => ({ lat: s.lat, lng: s.lng })), input.to].map((p) => ({ lat: p.lat, lng: p.lng })),
  };
}

export { CITIES };
