/**
 * NAR-J şarj hesaplama çekirdeği.
 * Saf fonksiyonlar — UI, API ve testler aynı kodu kullanır.
 *
 * Model:
 *  - Bataryaya giren enerji = kapasite × (hedef% − başlangıç%) / 100
 *  - Şebekeden çekilen enerji = bataryaya giren / şarj verimi (AC ≈ %90, DC ≈ %94)
 *  - Maliyet = şebeke enerjisi × kWh fiyatı
 *  - Süre: %1'lik adımlarla, SoC'a bağlı şarj eğrisi üzerinden integral
 */

export type ChargerType = 'AC' | 'DC';

export interface ChargeInput {
  batteryKwh: number;
  startSoc: number; // %
  targetSoc: number; // %
  chargerKw: number;
  vehicleMaxKw: number; // araç kabul edebildiği maks. güç (AC için onboard şarj cihazı)
  type: ChargerType;
  pricePerKwh: number; // ₺/kWh
  consumptionKwhPer100: number;
  efficiency?: number; // 0-1
}

export interface ChargeCurvePoint {
  soc: number;
  kw: number;
  minute: number;
}

export interface ChargeResult {
  energyToBatteryKwh: number;
  energyFromGridKwh: number;
  cost: number;
  minutes: number;
  rangeAddedKm: number;
  avgPowerKw: number;
  peakPowerKw: number;
  curve: ChargeCurvePoint[];
}

export const DEFAULT_EFFICIENCY: Record<ChargerType, number> = { AC: 0.9, DC: 0.94 };

/** Araç + istasyon kombinasyonunun belirli bir SoC'taki etkin gücü (kW). */
export function powerAtSoc(soc: number, chargerKw: number, vehicleMaxKw: number, type: ChargerType): number {
  const peak = Math.max(0, Math.min(chargerKw, vehicleMaxKw));
  if (peak === 0) return 0;
  const s = Math.min(100, Math.max(0, soc));
  let factor: number;
  if (type === 'AC') {
    factor = s < 95 ? 1 : 1 - ((s - 95) / 5) * 0.4; // son %5'te hafif düşüş
  } else if (s < 10) {
    factor = 0.75 + 0.025 * s; // ön ısıtma / rampa
  } else if (s < 50) {
    factor = 1;
  } else if (s < 80) {
    factor = 1 - ((s - 50) / 30) * 0.45;
  } else {
    factor = 0.55 - ((s - 80) / 20) * 0.4;
  }
  return peak * Math.max(0.05, factor);
}

export function validateChargeInput(i: ChargeInput): string | null {
  if (!(i.batteryKwh > 0 && i.batteryKwh <= 300)) return 'Batarya kapasitesi 1–300 kWh arasında olmalı.';
  if (i.startSoc < 0 || i.startSoc > 100 || i.targetSoc < 0 || i.targetSoc > 100) return 'Şarj seviyeleri %0–100 arasında olmalı.';
  if (i.targetSoc <= i.startSoc) return 'Hedef şarj seviyesi başlangıçtan büyük olmalı.';
  if (!(i.chargerKw > 0)) return 'İstasyon gücü pozitif olmalı.';
  if (!(i.vehicleMaxKw > 0)) return 'Araç şarj gücü pozitif olmalı.';
  if (i.pricePerKwh < 0) return 'Birim fiyat negatif olamaz.';
  if (!(i.consumptionKwhPer100 > 0)) return 'Tüketim pozitif olmalı.';
  return null;
}

export function computeCharge(input: ChargeInput): ChargeResult {
  const err = validateChargeInput(input);
  if (err) throw new RangeError(err);
  const eff = input.efficiency ?? DEFAULT_EFFICIENCY[input.type];
  const step = 0.5; // % SoC adımı
  let minutes = 0;
  let peak = 0;
  const curve: ChargeCurvePoint[] = [];
  for (let soc = input.startSoc; soc < input.targetSoc - 1e-9; soc += step) {
    const s = Math.min(step, input.targetSoc - soc);
    const kwh = (input.batteryKwh * s) / 100;
    const kw = powerAtSoc(soc + s / 2, input.chargerKw, input.vehicleMaxKw, input.type);
    peak = Math.max(peak, kw);
    if (curve.length === 0 || Math.round(soc) % 2 === 0) curve.push({ soc: +soc.toFixed(1), kw: +kw.toFixed(1), minute: +minutes.toFixed(1) });
    minutes += (kwh / kw) * 60;
  }
  curve.push({
    soc: input.targetSoc,
    kw: +powerAtSoc(input.targetSoc, input.chargerKw, input.vehicleMaxKw, input.type).toFixed(1),
    minute: +minutes.toFixed(1),
  });
  const energyToBatteryKwh = (input.batteryKwh * (input.targetSoc - input.startSoc)) / 100;
  const energyFromGridKwh = energyToBatteryKwh / eff;
  return {
    energyToBatteryKwh,
    energyFromGridKwh,
    cost: energyFromGridKwh * input.pricePerKwh,
    minutes,
    rangeAddedKm: (energyToBatteryKwh / input.consumptionKwhPer100) * 100,
    avgPowerKw: minutes > 0 ? energyToBatteryKwh / (minutes / 60) : 0,
    peakPowerKw: peak,
    curve,
  };
}

/** 100 km başına maliyet karşılaştırması (EV vs içten yanmalı). */
export function costPer100Km(opts: {
  consumptionKwhPer100: number;
  pricePerKwh: number;
  efficiency?: number;
  iceLitersPer100: number;
  fuelPricePerLiter: number;
}) {
  const ev = (opts.consumptionKwhPer100 / (opts.efficiency ?? 0.92)) * opts.pricePerKwh;
  const ice = opts.iceLitersPer100 * opts.fuelPricePerLiter;
  return { ev, ice, savings: ice - ev, savingsPct: ice > 0 ? ((ice - ev) / ice) * 100 : 0 };
}
