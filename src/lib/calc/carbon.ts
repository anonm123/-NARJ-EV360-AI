/**
 * Karbon ve enerji analitiği.
 * Varsayılan katsayılar yaklaşık değerlerdir ve kullanıcı tarafından değiştirilebilir:
 *  - Şebeke emisyon faktörü: ~0,44 kg CO₂/kWh (Türkiye elektrik karışımı için yaklaşık değer)
 *  - Benzin: ~2,31 kg CO₂/L, Dizel: ~2,68 kg CO₂/L (yanma kaynaklı, yaklaşık)
 */
export const CARBON_DEFAULTS = {
  gridKgPerKwh: 0.44,
  gasolineKgPerLiter: 2.31,
  dieselKgPerLiter: 2.68,
  kgPerTree: 21, // bir ağacın yıllık ortalama CO₂ tutumu (yaklaşık)
};

export interface CarbonInput {
  kmPerYear: number;
  evKwhPer100: number;
  chargeEfficiency?: number;
  gridKgPerKwh?: number;
  renewableShare?: number; // 0-100, yenilenebilir tarifeli şarj payı
  iceLitersPer100: number;
  fuel: 'gasoline' | 'diesel';
}

export function computeCarbon(i: CarbonInput) {
  if (i.kmPerYear < 0 || i.evKwhPer100 <= 0 || i.iceLitersPer100 <= 0) throw new RangeError('Geçersiz karbon girdisi');
  const eff = i.chargeEfficiency ?? 0.92;
  const grid = i.gridKgPerKwh ?? CARBON_DEFAULTS.gridKgPerKwh;
  const renew = Math.min(100, Math.max(0, i.renewableShare ?? 0)) / 100;
  const evKwh = ((i.kmPerYear / 100) * i.evKwhPer100) / eff;
  const evKg = evKwh * grid * (1 - renew);
  const liters = (i.kmPerYear / 100) * i.iceLitersPer100;
  const iceKg = liters * (i.fuel === 'diesel' ? CARBON_DEFAULTS.dieselKgPerLiter : CARBON_DEFAULTS.gasolineKgPerLiter);
  const savedKg = iceKg - evKg;
  return {
    evKwh,
    evKg,
    iceKg,
    liters,
    savedKg,
    savedPct: iceKg > 0 ? (savedKg / iceKg) * 100 : 0,
    treeEquivalent: savedKg / CARBON_DEFAULTS.kgPerTree,
  };
}
