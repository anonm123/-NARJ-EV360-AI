import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { normalizeOcm, normalizeOsm, normalizeEpdk, epdkRows, epdkSocket, mergeStations, parsePowerKw, connectorKind, isDc, type EpdkResponse, type OcmPoi, type OcmRef, type OsmElement } from '@/lib/stations/normalize';
import { cumulativeKm, pointAtKm, projectOnRoute, simplify, type LngLat } from '@/lib/routing/geometry';
import { planTrip, TripError, adjustedConsumption, type FoundStation } from '@/lib/calc/trip';

const ocm = JSON.parse(fs.readFileSync('tests/fixtures/ocm-sample.json', 'utf8')) as { ref: OcmRef; pois: OcmPoi[] };
const osm = JSON.parse(fs.readFileSync('tests/fixtures/overpass-sample.json', 'utf8')) as { elements: OsmElement[] };
const epdk = JSON.parse(fs.readFileSync('tests/fixtures/epdk-sample.json', 'utf8')) as EpdkResponse;
const osrm = JSON.parse(fs.readFileSync('tests/fixtures/osrm-konya-ankara.json', 'utf8'));
const AT = '2026-11-23T00:00:00Z';

describe('istasyon normalizasyonu', () => {
  const s = ocm.pois.map((p) => normalizeOcm(p, ocm.ref, AT));
  it('OCM: soket, güç, AC/DC, operatör, durum ve kaynak lisansı', () => {
    const a = s[0]!;
    expect(a.id).toBe('ocm:1001');
    expect(a.maxPowerKw).toBe(120);
    expect(a.connectors.map((c) => [c.kind, c.current])).toEqual([['CCS2', 'DC'], ['Type 2', 'AC']]);
    expect(a.operator).toBe('Test Operatör');
    expect(a.status).toBe('operational');
    expect(a.sources[0].license).toMatch(/CC BY 4\.0/);
    expect(a.sources[0].url).toBe('https://openchargemap.org/site/poi/details/1001');
    expect(isDc(a)).toBe(true);
  });
  it('OCM: eksik veri "bilinmiyor" (null) kalır, uydurulmaz', () => {
    const b = s[1]!;
    expect(b.operator).toBeNull(); // "(Unknown Operator)" operatör sayılmaz
    expect(b.maxPowerKw).toBeNull();
    expect(b.status).toBe('unknown');
    expect(b.connectors[0].current).toBeNull();
  });
  it('OCM: açık veri lisanslı olmayan sağlayıcı ve koordinatsız kayıt dışlanır', () => {
    expect(s[2]).toBeNull();
    expect(s[3]).toBeNull();
  });
  it('OSM: socket:* etiketleri, node/way, ODbL atfı', () => {
    const o = osm.elements.map((e) => normalizeOsm(e, AT));
    expect(o[0]!.connectors[0]).toMatchObject({ kind: 'CCS2', powerKw: 150, current: 'DC', quantity: 2 });
    expect(o[0]!.openingHours).toBe('24/7');
    expect(o[1]!.lat).toBe(37.8); // way → center
    expect(o[1]!.sources[0].license).toMatch(/ODbL/);
    expect(o[2]).toBeNull(); // charging_station değil
  });
  it('güç ve soket ayrıştırma', () => {
    expect(parsePowerKw('22 kW')).toBe(22);
    expect(parsePowerKw('7,4 kW')).toBe(7.4);
    expect(parsePowerKw('3700 W')).toBe(3.7);
    expect(parsePowerKw('bilinmiyor')).toBeNull();
    expect(connectorKind('CCS (Type 2)')).toBe('CCS2');
    expect(connectorKind('Type 2 (Tethered Connector) ')).toBe('Type 2');
  });
  it('birleştirme: yakın ve benzer kayıt tek istasyon olur, iki kaynak korunur, çelişki yazılır', () => {
    const a = s.filter((x) => x !== null);
    const b = osm.elements.map((e) => normalizeOsm(e, AT)).filter((x) => x !== null);
    const m = mergeStations(a, b);
    const merged = m.find((x) => x.id === 'ocm:1001')!;
    expect(merged.sources.map((x) => x.provider)).toEqual(['ocm', 'osm']);
    expect(merged.openingHours).toBe('24/7'); // eksik alan diğer kaynaktan
    expect(merged.conflicts.some((c) => c.startsWith('maxPowerKw'))).toBe(true); // 120 vs 150 sessizce birleştirilmez
    expect(m).toHaveLength(3); // 2 OCM + 1 eşleşmeyen OSM
  });
});

describe('EPDK şarj istasyonları web servisi', () => {
  const rows = epdkRows(epdk);
  const st = rows.map((r) => normalizeEpdk(r, AT));
  it('nesne ve dizi biçimli satırları columnNames ile okur', () => {
    expect(rows).toHaveLength(4);
    expect(rows[1].sarjIstasyonuNo).toBe('TEST-002');
    expect(rows[1].enlem).toBe(39.92);
  });
  it('virgüllü koordinat, soket tipi/gücü/akımı, hizmet şekli ve kaynak bilgisi', () => {
    const a = st[0]!;
    expect(a.id).toBe('epdk:TEST-001');
    expect(a.lat).toBeCloseTo(37.90008, 6);
    expect(a.connectors.map((c) => [c.kind, c.current, c.powerKw])).toEqual([['Type 2', 'AC', 22], ['CCS2', 'DC', 120]]);
    expect(a.maxPowerKw).toBe(120);
    expect(a.operator).toBe('Test Operatör');
    expect(a.access).toBe('Halka Açık');
    expect(a.status).toBe('unknown'); // lisans kaydı çalışma durumu bildirmez
    expect(a.sources[0].provider).toBe('epdk');
    expect(a.sources[0].license).toMatch(/ticari kullanım/);
  });
  it('metin biçimli soket listesi çözümlenir', () => {
    expect(st[1]!.connectors.map((c) => [c.kind, c.current, c.powerKw])).toEqual([['CHAdeMO', 'DC', 50], ['Type 2', 'AC', 22]]);
  });
  it('hatalı koordinatlı kayıt atlanır; anlaşılamayan soket uydurulmaz', () => {
    expect(st[2]).toBeNull();
    expect(st[3]!.connectors).toEqual([]);
    expect(st[3]!.maxPowerKw).toBeNull();
    expect(epdkSocket(null)).toBeNull();
  });
  it('üç kaynak birleştirme: EPDK birincil, OCM ve OSM kaynak olarak eklenir', () => {
    const e = st.filter((x) => x !== null);
    const o = ocm.pois.map((p) => normalizeOcm(p, ocm.ref, AT)).filter((x) => x !== null);
    const m = osm.elements.map((x) => normalizeOsm(x, AT)).filter((x) => x !== null);
    const all = mergeStations(mergeStations(e, o), m);
    const k = all.find((x) => x.id === 'epdk:TEST-001')!;
    expect(k.sources.map((x) => x.provider)).toEqual(['epdk', 'ocm', 'osm']);
    expect(k.openingHours).toBe('24/7'); // OSM'den doldurulur
    expect(k.status).toBe('operational'); // OCM bildirdi; EPDK bilinmiyordu
    expect(k.conflicts.some((c) => c.startsWith('maxPowerKw: OSM'))).toBe(true); // 120 vs 150
    expect(all.some((x) => x.id === 'ocm:1001')).toBe(false); // ayrı kayıt olarak çoğaltılmaz
  });
});

describe('rota geometrisi (gerçek OSRM yanıtı: Konya → Ankara)', () => {
  const coords = osrm.routes[0].geometry.coordinates as LngLat[];
  const total = osrm.routes[0].distance / 1000;
  it('kümülatif mesafe yol mesafesine ölçeklenir', () => {
    const cum = cumulativeKm(coords, total);
    expect(cum[cum.length - 1]).toBeCloseTo(total, 6);
    expect(total).toBeGreaterThan(260);
    expect(total).toBeLessThan(280);
  });
  it('km noktası ve izdüşüm tutarlı', () => {
    const cum = cumulativeKm(coords, total);
    const p = pointAtKm(coords, cum, 100);
    const pr = projectOnRoute(coords, cum, p);
    expect(pr.offKm).toBeLessThan(15);
    expect(Math.abs(pr.km - 100)).toBeLessThan(40);
  });
  it('sadeleştirme uçları korur', () => {
    const s = simplify(coords, 0.05);
    expect(s[0]).toEqual(coords[0]);
    expect(s[s.length - 1]).toEqual(coords[coords.length - 1]);
    expect(s.length).toBeLessThanOrEqual(coords.length);
  });
});

describe('planTrip (gerçek yol mesafesi + istasyon bulucu)', () => {
  const vehicle = { batteryKwh: 64, consumptionKwhPer100: 17, maxDcKw: 130 };
  const base = { distanceKm: 443.4, durationMin: 300, vehicle, startSoc: 80, reserveSoc: 12, targetSoc: 80 };
  const st = (km: number, kw: number | null = 120): FoundStation => ({ id: `t${km}`, name: `Durak ${km}`, km, offRouteKm: 1, maxPowerKw: kw, lat: 0, lng: 0 });

  it('menzil yetiyorsa durak yok', async () => {
    const p = await planTrip({ ...base, distanceKm: 150, startSoc: 90 }, async () => st(50));
    expect(p.stops).toHaveLength(0);
    expect(p.arrivalSoc).toBeGreaterThanOrEqual(12);
  });
  it('istasyon bulucunun verdiği gerçek konumda durur, enerji dengesi tutar', async () => {
    const p = await planTrip(base, async (_min, max) => st(Math.floor(max - 10)));
    expect(p.stops.length).toBeGreaterThan(0);
    expect(p.arrivalSoc).toBeGreaterThanOrEqual(12 - 1e-6);
    for (const s of p.stops) expect(s.arriveSoc).toBeGreaterThanOrEqual(12);
    const charged = p.stops.reduce((a, s) => a + ((s.departSoc - s.arriveSoc) / 100) * 64, 0);
    expect(0.8 * 64 + charged - p.energyKwh).toBeCloseTo((p.arrivalSoc / 100) * 64, 3);
  });
  it('istasyon bulunamazsa plan uydurmaz, hata verir', async () => {
    await expect(planTrip(base, async () => null)).rejects.toBeInstanceOf(TripError);
  });
  it('fiyat girilmezse maliyet null, güç bilinmiyorsa varsayım işaretlenir', async () => {
    const p = await planTrip(base, async (_a, max) => st(Math.floor(max - 5), null));
    expect(p.totalCost).toBeNull();
    expect(p.stops[0].powerAssumed).toBe(true);
  });
  it('düzeltmeler yalnızca verisi olan etkenler için', () => {
    const a = adjustedConsumption(17, 80, null);
    expect(a.value).toBe(17);
    expect(a.corrections.join(' ')).toMatch(/Rakım verisi yok/);
    expect(adjustedConsumption(17, 80, 0).value).toBeGreaterThan(17);
  });
});
