import { describe, expect, it } from 'vitest';
import { computeCharge, costPer100Km, powerAtSoc, validateChargeInput } from '@/lib/calc/charging';

const base = {
  batteryKwh: 60,
  startSoc: 20,
  targetSoc: 80,
  chargerKw: 50,
  vehicleMaxKw: 100,
  type: 'DC' as const,
  pricePerKwh: 10,
  consumptionKwhPer100: 15,
  efficiency: 1,
};

describe('computeCharge', () => {
  it('enerji ve maliyeti doğru hesaplar', () => {
    const r = computeCharge(base);
    expect(r.energyToBatteryKwh).toBeCloseTo(36, 6); // 60 × 0.6
    expect(r.energyFromGridKwh).toBeCloseTo(36, 6);
    expect(r.cost).toBeCloseTo(360, 6);
    expect(r.rangeAddedKm).toBeCloseTo(240, 6); // 36 / 15 × 100
  });

  it('şarj kayıplarını şebeke enerjisine ekler', () => {
    const r = computeCharge({ ...base, efficiency: 0.9 });
    expect(r.energyFromGridKwh).toBeCloseTo(40, 6);
    expect(r.cost).toBeCloseTo(400, 6);
  });

  it('AC sabit güçte süre = enerji / güç', () => {
    const r = computeCharge({ ...base, type: 'AC', chargerKw: 11, vehicleMaxKw: 11, startSoc: 10, targetSoc: 90 });
    // 48 kWh / 11 kW = 4.3636 sa = 261.8 dk (son %5'teki düşüş hedef 90 olduğundan etkisiz)
    expect(r.minutes).toBeCloseTo((48 / 11) * 60, 0);
  });

  it('istasyon ve araç limitinden küçük olanı kullanır', () => {
    expect(powerAtSoc(30, 300, 120, 'DC')).toBe(120);
    expect(powerAtSoc(30, 50, 120, 'DC')).toBe(50);
    expect(powerAtSoc(90, 300, 200, 'DC')).toBeLessThan(200 * 0.55);
  });

  it('DC şarj %80 üstünde yavaşlar', () => {
    const a = computeCharge({ ...base, chargerKw: 150, vehicleMaxKw: 150, startSoc: 20, targetSoc: 50 });
    const b = computeCharge({ ...base, chargerKw: 150, vehicleMaxKw: 150, startSoc: 70, targetSoc: 100 });
    expect(b.minutes).toBeGreaterThan(a.minutes * 2);
  });

  it('geçersiz girdileri reddeder', () => {
    expect(validateChargeInput({ ...base, targetSoc: 10 })).toMatch(/Hedef/);
    expect(() => computeCharge({ ...base, batteryKwh: 0 })).toThrow(RangeError);
  });
});

describe('costPer100Km', () => {
  it('EV ve fosil yakıt maliyetini karşılaştırır', () => {
    const r = costPer100Km({ consumptionKwhPer100: 18, pricePerKwh: 10, efficiency: 0.9, iceLitersPer100: 7, fuelPricePerLiter: 50 });
    expect(r.ev).toBeCloseTo(200, 6);
    expect(r.ice).toBeCloseTo(350, 6);
    expect(r.savings).toBeCloseTo(150, 6);
    expect(r.savingsPct).toBeCloseTo(42.857, 2);
  });
});
