import { describe, expect, it } from 'vitest';
import { planRoute, adjustConsumption } from '@/lib/calc/route';
import { cityById, haversineKm, estimateRoadKm } from '@/lib/data/cities';
import { computeCarbon } from '@/lib/calc/carbon';
import { projectRevenue, REVENUE_PRESETS, cagr } from '@/lib/calc/revenue';
import { sessionCost, SAMPLE_OPERATORS } from '@/lib/data/operators';

const ist = cityById('istanbul')!;
const ank = cityById('ankara')!;
const ant = cityById('antalya')!;

describe('mesafe', () => {
  it('İstanbul–Ankara kuş uçuşu ≈ 350 km', () => {
    expect(haversineKm(ist, ank)).toBeGreaterThan(340);
    expect(haversineKm(ist, ank)).toBeLessThan(360);
    expect(estimateRoadKm(ist, ank)).toBeCloseTo(haversineKm(ist, ank) * 1.22, 6);
  });
});

describe('planRoute', () => {
  const vehicle = { batteryKwh: 64, consumptionKwhPer100: 17, maxDcKw: 130 };
  it('kısa rotada durak gerekmez', () => {
    const p = planRoute({ from: ist, to: cityById('kocaeli')!, ...vehicle, startSoc: 90, arrivalMinSoc: 15, mode: 'balanced', speedKmh: 100, tempC: 20, dcPricePerKwh: 14 });
    expect(p.stops).toHaveLength(0);
    expect(p.arrivalSoc).toBeGreaterThan(15);
  });

  it('uzun rotada varış şarjını ve rezervi korur', () => {
    const p = planRoute({ from: ist, to: ant, ...vehicle, startSoc: 80, arrivalMinSoc: 15, mode: 'balanced', speedKmh: 110, tempC: 15, dcPricePerKwh: 14 });
    expect(p.stops.length).toBeGreaterThan(0);
    expect(p.arrivalSoc).toBeGreaterThanOrEqual(15 - 1e-6);
    for (const s of p.stops) {
      expect(s.socIn).toBeGreaterThanOrEqual(10 - 1e-6);
      expect(s.socOut).toBeLessThanOrEqual(100);
      expect(s.socOut).toBeGreaterThan(s.socIn);
    }
    // enerji dengesi: başlangıç + şarj edilen = tüketilen + varış (bataryaya giren enerji bazında)
    const charged = p.stops.reduce((a, s) => a + ((s.socOut - s.socIn) / 100) * vehicle.batteryKwh, 0);
    const consumed = p.distanceKm * (p.adjustedConsumption / 100);
    expect((80 / 100) * 64 + charged - consumed).toBeCloseTo((p.arrivalSoc / 100) * 64, 3);
  });

  it('hızlı mod daha kısa şarj süresi verir', () => {
    const args = { from: ist, to: ant, ...vehicle, startSoc: 80, arrivalMinSoc: 10, speedKmh: 110, tempC: 15, dcPricePerKwh: 14 };
    const fast = planRoute({ ...args, mode: 'fastest' });
    const cheap = planRoute({ ...args, mode: 'cheapest' });
    expect(fast.chargeMinutes).toBeLessThan(cheap.chargeMinutes);
    expect(cheap.totalCost).toBeLessThan(fast.totalCost);
  });

  it('soğuk havada ve yüksek hızda tüketim artar', () => {
    expect(adjustConsumption(17, 120, 20)).toBeGreaterThan(17);
    expect(adjustConsumption(17, 100, -5)).toBeGreaterThan(17);
    expect(adjustConsumption(17, 100, 20)).toBe(17);
  });

  it('aynı şehir hatası', () => {
    expect(() => planRoute({ from: ist, to: ist, ...vehicle, startSoc: 80, arrivalMinSoc: 10, mode: 'balanced', speedKmh: 100, tempC: 20, dcPricePerKwh: 14 })).toThrow();
  });
});

describe('computeCarbon', () => {
  it('yıllık emisyonu hesaplar', () => {
    const r = computeCarbon({ kmPerYear: 15000, evKwhPer100: 18, chargeEfficiency: 0.9, gridKgPerKwh: 0.44, iceLitersPer100: 7, fuel: 'gasoline' });
    expect(r.evKwh).toBeCloseTo(3000, 6);
    expect(r.evKg).toBeCloseTo(1320, 6);
    expect(r.iceKg).toBeCloseTo(1050 * 2.31, 6);
    expect(r.savedKg).toBeCloseTo(2425.5 - 1320, 6);
  });
  it('%100 yenilenebilir şarjda EV emisyonu sıfır', () => {
    const r = computeCarbon({ kmPerYear: 10000, evKwhPer100: 15, renewableShare: 100, iceLitersPer100: 6, fuel: 'diesel' });
    expect(r.evKg).toBe(0);
  });
});

describe('gelir modeli', () => {
  it('yıl sayısı kadar satır ve tutarlı toplam üretir', () => {
    const rows = projectRevenue(REVENUE_PRESETS.baz);
    expect(rows).toHaveLength(5);
    for (const r of rows) expect(r.total).toBeCloseTo(r.subscription + r.fleetSaas + r.transactions + r.operatorApi, 6);
    expect(rows[4].total).toBeGreaterThan(rows[0].total);
  });
  it('ilk yıl abonelik geliri', () => {
    const r = projectRevenue({ ...REVENUE_PRESETS.baz, years: 1 })[0];
    expect(r.subscription).toBeCloseTo(20000 * 0.06 * 129 * 12, 6);
  });
  it('CAGR', () => {
    expect(cagr(100, 200, 1)).toBeCloseTo(100, 6);
    expect(cagr(100, 400, 2)).toBeCloseTo(100, 6);
  });
});

describe('operatör oturum maliyeti', () => {
  it('oturum + enerji + bekleme', () => {
    const op = { ...SAMPLE_OPERATORS[0], sessionFee: 5, dcPrice: 10, idleFeePerMin: 2 };
    expect(sessionCost(op, 30, 'dc', 10)).toBe(5 + 300 + 20);
  });
});

import { answer } from '@/lib/assistant/engine';
import { luhn } from '@/lib/validation';
describe('asistan', () => {
  it('rota niyetini tanır ve gerçek planlayıcıyı kullanır', () => {
    const r = answer("İstanbul'dan Ankara'ya %70 ile gidebilir miyim?");
    expect(r.intent).toBe('route');
    expect(r.text).toMatch(/İstanbul → Ankara/);
  });
  it('şarj maliyeti niyeti', () => {
    expect(answer('%20den %80e şarj ne kadar tutar').intent).toBe('charge');
  });
  it('bilinmeyen soru', () => {
    expect(answer('hava nasıl').intent).toBe('fallback');
  });
});
describe('luhn', () => {
  it('test kartı geçerli, rastgele geçersiz', () => {
    expect(luhn('4242 4242 4242 4242')).toBe(true);
    expect(luhn('4242 4242 4242 4241')).toBe(false);
  });
});

import { createMockAdapter } from '@/lib/adapters';
describe('demo operatör adaptörü', () => {
  it('lokasyonları listeler ve simülasyon işaretler', async () => {
    const a = createMockAdapter('op-a');
    const locs = await a.listLocations();
    expect(locs.length).toBeGreaterThan(0);
    const st = await a.getAvailability(locs[0].evses[0].id);
    expect(st.source).toBe('simulated');
    const r = await a.reserve({ evseId: locs[0].evses[0].id, startsAt: new Date().toISOString(), durationMin: 30, token: 't' });
    expect(r.simulated).toBe(true);
  });
});

describe('finansal model: CAC, churn, gider, vergi, nakit', () => {
  const base = { ...REVENUE_PRESETS.baz, years: 2, usersY1: 1000, userGrowthPct: 100, monthlyChurnPct: 0, cacPerUser: 10, opexYear1: 100000, opexGrowthPct: 10, taxRatePct: 20, startingCash: 50000 };
  it('yeni kullanıcı ve edinme maliyeti (churn yok)', () => {
    const r = projectRevenue(base);
    expect(r[0].newUsers).toBe(1000);
    expect(r[1].newUsers).toBe(1000); // 2000 - 1000
    expect(r[0].acquisitionCost).toBe(10000);
  });
  it('churn yeni kullanıcı ihtiyacını artırır', () => {
    const r = projectRevenue({ ...base, monthlyChurnPct: 5 });
    expect(r[1].newUsers).toBeGreaterThan(1000);
  });
  it('EBITDA, vergi yalnızca pozitifte, kümülatif nakit', () => {
    const r = projectRevenue(base);
    for (const x of r) {
      expect(x.ebitda).toBeCloseTo(x.grossProfit - x.acquisitionCost - x.opex, 6);
      expect(x.tax).toBeCloseTo(x.ebitda > 0 ? x.ebitda * 0.2 : 0, 6);
    }
    expect(r[1].cumulativeCash).toBeCloseTo(50000 + r[0].netIncome + r[1].netIncome, 6);
    expect(r[1].opex).toBeCloseTo(110000, 6);
  });
});
