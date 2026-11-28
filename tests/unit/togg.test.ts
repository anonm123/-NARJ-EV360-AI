import { describe, expect, it } from 'vitest';
import { consumptionFor, realRangeFor, SOURCES, TOGG_COLORS, TOGG_VERSIONS, DEFAULT_TOGG_ID, type Spec } from '@/lib/data/togg';
import { VEHICLE_PROFILES, vehicleById, DEFAULT_VEHICLE_ID } from '@/lib/data/vehicles';
import { answer } from '@/lib/assistant/engine';

const allSpecs = (s: Record<string, Spec<number> | Spec<string>>) => Object.entries(s);

describe('Togg veri bütünlüğü', () => {
  it('katalog yalnızca Togg sürümlerinden oluşur ve kimlikler benzersizdir', () => {
    expect(VEHICLE_PROFILES.length).toBe(TOGG_VERSIONS.length);
    expect(VEHICLE_PROFILES.every((p) => p.name.startsWith('Togg '))).toBe(true);
    expect(new Set(TOGG_VERSIONS.map((v) => v.id)).size).toBe(TOGG_VERSIONS.length);
    expect(vehicleById(DEFAULT_VEHICLE_ID)?.id).toBe(DEFAULT_TOGG_ID);
  });
  it('istenen sürümler mevcut', () => {
    for (const id of ['t10x-v1-rwd-std', 't10x-v1-rwd-long', 't10x-v2-rwd-long', 't10f-v1-rwd-std', 't10f-v1-rwd-long', 't10f-v2-rwd-long']) {
      expect(TOGG_VERSIONS.some((v) => v.id === id)).toBe(true);
    }
  });
  it('"resmi" durumundaki her değerin kaynağı ve sayısal değeri var; "dogrulanamadi" değer içermez', () => {
    for (const v of TOGG_VERSIONS) {
      for (const [k, s] of allSpecs(v.specs)) {
        if (s.status === 'resmi' || s.status === 'resmi-genel' || s.status === 'surum-teyitsiz' || s.status === 'celiskili') {
          expect(s.source, `${v.id}.${k}`).toBeDefined();
          expect(SOURCES[s.source!], `${v.id}.${k}`).toBeDefined();
          expect(s.value, `${v.id}.${k}`).not.toBeNull();
        }
        if (s.status === 'dogrulanamadi') expect(s.value, `${v.id}.${k}`).toBeNull();
      }
    }
  });
  it('renkler tanımlı ve sürüm başına en az bir renk', () => {
    for (const v of TOGG_VERSIONS) {
      expect(v.colors.length).toBeGreaterThan(0);
      for (const c of v.colors) expect(TOGG_COLORS[c], `${v.id}:${c}`).toBeDefined();
    }
    expect(TOGG_VERSIONS.find((v) => v.id === 't10x-v2-4more')!.colors).toEqual(['ayder', 'anadolu', 'kula', 'oltu', 'seyhan']);
  });
  it('resmî değerler resmî kaynakla tutarlı (T10X V1 Uzun Menzil, T10F V2 Uzun Menzil)', () => {
    const x = TOGG_VERSIONS.find((v) => v.id === 't10x-v1-rwd-long')!;
    expect([x.specs.batteryKwh.value, x.specs.wltpRangeKm.value, x.specs.powerKw.value, x.specs.torqueNm.value]).toEqual([89.6, 523, 160, 350]);
    const f = TOGG_VERSIONS.find((v) => v.id === 't10f-v2-rwd-long')!;
    expect([f.specs.batteryKwh.value, f.specs.wltpRangeKm.value]).toEqual([89.6, 610]);
  });
});

describe('NAR-J tahminleri resmî veriden ayrı', () => {
  it('resmî tüketim varsa aynen kullanılır', () => {
    const x = TOGG_VERSIONS.find((v) => v.id === 't10x-v1-rwd-long')!;
    expect(consumptionFor(x)).toMatchObject({ value: 19.7, status: 'resmi' });
  });
  it('resmî tüketim yoksa tahmini olarak işaretlenir', () => {
    for (const v of TOGG_VERSIONS) {
      const c = consumptionFor(v);
      expect(c.value).toBeGreaterThan(10);
      expect(c.value).toBeLessThan(30);
      if (v.specs.consumptionKwhPer100.value == null) expect(c.status).toBe('tahmini');
    }
  });
  it('gerçek kullanım menzili her zaman tahmini ve WLTP\'den kısa', () => {
    for (const v of TOGG_VERSIONS) {
      const r = realRangeFor(v);
      expect(r.status).toBe('tahmini');
      if (v.specs.wltpRangeKm.value != null) expect(r.value!).toBeLessThan(v.specs.wltpRangeKm.value);
    }
  });
});

describe('asistan Togg sürümlerini tanır', () => {
  it('varsayılan araç T10X V1 Uzun Menzil', () => {
    expect(answer('%20den %80e şarj ne kadar tutar').text).toMatch(/Togg T10X V1 Uzun Menzil/);
  });
  it('T10F ve 4More eşleşmesi', () => {
    expect(answer('T10F ile %15ten %80e şarj ne kadar tutar').text).toMatch(/T10F/);
    expect(answer('T10X V2 4More Obsidiyen ile %20den %80e şarj süresi').text).toMatch(/4More/);
  });
});
