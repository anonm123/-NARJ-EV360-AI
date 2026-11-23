/** Saf normalizasyon fonksiyonları (sunucu/istemci bağımsız; birim testleri bunları kullanır). */
import type { Connector, ConnectorKind, CurrentKind, Station } from './types';

export function connectorKind(label: string): ConnectorKind {
  const l = label.toLowerCase();
  if (l.includes('ccs') || l.includes('combo')) return 'CCS2';
  if (l.includes('chademo')) return 'CHAdeMO';
  if (l.includes('tesla')) return 'Tesla';
  if (l.includes('type 2') || l.includes('type2') || l.includes('mennekes') || l.includes('iec 62196-2')) return 'Type 2';
  if (l.includes('schuko') || l.includes('cee 7/4')) return 'Schuko';
  return 'Diğer';
}

/** "22 kW", "50kW", "7.4 kW" → sayı; çözümlenemezse null. */
export function parsePowerKw(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (typeof v !== 'string') return null;
  const m = v.replace(',', '.').match(/([\d.]+)\s*(kw|w)?/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (m[2]?.toLowerCase() === 'w') n = n / 1000;
  return Math.round(n * 10) / 10;
}

export function maxPower(connectors: Connector[]): number | null {
  const p = connectors.map((c) => c.powerKw).filter((x): x is number => x != null);
  return p.length ? Math.max(...p) : null;
}

/* ───────────────────────── Open Charge Map ───────────────────────── */
export interface OcmRef {
  ConnectionTypes?: { ID: number; Title?: string; FormalName?: string }[];
  CurrentTypes?: { ID: number; Title?: string }[];
  Operators?: { ID: number; Title?: string }[];
  StatusTypes?: { ID: number; Title?: string; IsOperational?: boolean | null }[];
  DataProviders?: { ID: number; Title?: string; License?: string | null; IsOpenDataLicensed?: boolean | null; WebsiteURL?: string | null }[];
}
export interface OcmPoi {
  ID: number;
  DataProviderID?: number | null;
  OperatorID?: number | null;
  UsageCost?: string | null;
  StatusTypeID?: number | null;
  NumberOfPoints?: number | null;
  DateLastStatusUpdate?: string | null;
  DateLastVerified?: string | null;
  AddressInfo?: {
    Title?: string | null;
    AddressLine1?: string | null;
    AddressLine2?: string | null;
    Town?: string | null;
    StateOrProvince?: string | null;
    Latitude?: number;
    Longitude?: number;
  };
  Connections?: { ConnectionTypeID?: number | null; CurrentTypeID?: number | null; PowerKW?: number | null; Quantity?: number | null; StatusTypeID?: number | null }[];
}

const OCM_UNKNOWN_OPERATORS = new Set([0, 1, 44, 45]); // "(Unknown Operator)", "(Business Owner at Location)" vb. genel kayıtlar

export function normalizeOcm(poi: OcmPoi, ref: OcmRef, fetchedAt: string): Station | null {
  const lat = poi.AddressInfo?.Latitude;
  const lng = poi.AddressInfo?.Longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const provider = ref.DataProviders?.find((d) => d.ID === poi.DataProviderID);
  // Lisansı açıkça açık veri olmayan sağlayıcı kayıtları kullanılmaz.
  if (!provider || provider.IsOpenDataLicensed === false) return null;
  const ct = (id?: number | null) => ref.ConnectionTypes?.find((c) => c.ID === id);
  const cur = (id?: number | null): CurrentKind => {
    const t = ref.CurrentTypes?.find((c) => c.ID === id)?.Title ?? '';
    return /dc/i.test(t) ? 'DC' : /ac/i.test(t) ? 'AC' : null;
  };
  const connectors: Connector[] = (poi.Connections ?? []).map((c) => {
    const label = ct(c.ConnectionTypeID)?.Title ?? 'Bilinmeyen soket';
    return { kind: connectorKind(label), label, powerKw: parsePowerKw(c.PowerKW ?? null), current: cur(c.CurrentTypeID), quantity: c.Quantity ?? null };
  });
  const status = ref.StatusTypes?.find((s) => s.ID === poi.StatusTypeID);
  const op = poi.OperatorID != null && !OCM_UNKNOWN_OPERATORS.has(poi.OperatorID) ? ref.Operators?.find((o) => o.ID === poi.OperatorID)?.Title ?? null : null;
  const a = poi.AddressInfo!;
  const address = [a.AddressLine1, a.AddressLine2].filter(Boolean).join(', ') || null;
  return {
    id: `ocm:${poi.ID}`,
    name: a.Title?.trim() || null,
    lat,
    lng,
    address,
    city: a.StateOrProvince?.trim() || a.Town?.trim() || null,
    operator: op,
    connectors,
    maxPowerKw: maxPower(connectors),
    points: poi.NumberOfPoints ?? null,
    status: status?.IsOperational === true ? 'operational' : status?.IsOperational === false ? (/plan/i.test(status.Title ?? '') ? 'planned' : 'not_operational') : 'unknown',
    usageCost: poi.UsageCost?.trim() || null,
    openingHours: null,
    sources: [
      {
        provider: 'ocm',
        id: String(poi.ID),
        url: `https://openchargemap.org/site/poi/details/${poi.ID}`,
        license: provider.License?.trim() || 'Lisans bilgisi sağlayıcıda belirtilmemiş',
        attribution: `Open Charge Map · ${provider.Title ?? 'veri sağlayıcı'}`,
        updatedAt: poi.DateLastStatusUpdate ?? poi.DateLastVerified ?? null,
        fetchedAt,
      },
    ],
    conflicts: [],
  };
}

/* ───────────────────────── OpenStreetMap (Overpass) ───────────────────────── */
export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const OSM_SOCKETS: [string, string][] = [
  ['type2_combo', 'CCS (Type 2 Combo)'],
  ['chademo', 'CHAdeMO'],
  ['type2', 'Type 2'],
  ['type2_cable', 'Type 2 (kablolu)'],
  ['tesla_supercharger', 'Tesla Supercharger'],
  ['schuko', 'Schuko'],
];

export function normalizeOsm(el: OsmElement, fetchedAt: string): Station | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  const t = el.tags ?? {};
  if (typeof lat !== 'number' || typeof lng !== 'number' || t.amenity !== 'charging_station') return null;
  const connectors: Connector[] = [];
  for (const [key, label] of OSM_SOCKETS) {
    const v = t[`socket:${key}`];
    if (!v || v === 'no' || v === '0') continue;
    const qty = /^\d+$/.test(v) ? Number(v) : null;
    const kind = connectorKind(label);
    connectors.push({ kind, label, powerKw: parsePowerKw(t[`socket:${key}:output`]), current: kind === 'CCS2' || kind === 'CHAdeMO' ? 'DC' : kind === 'Type 2' || kind === 'Schuko' ? 'AC' : null, quantity: qty });
  }
  const addr = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ') || null;
  const cap = t.capacity && /^\d+$/.test(t.capacity) ? Number(t.capacity) : null;
  return {
    id: `osm:${el.type}/${el.id}`,
    name: t.name?.trim() || null,
    lat,
    lng,
    address: addr,
    city: t['addr:city'] || t['addr:province'] || null,
    operator: t.operator || t.brand || t.network || null,
    connectors,
    maxPowerKw: maxPower(connectors),
    points: cap,
    status: t.disused === 'yes' || t['operational_status'] === 'closed' ? 'not_operational' : 'unknown',
    usageCost: t.charge || null,
    openingHours: t.opening_hours || null,
    sources: [
      {
        provider: 'osm',
        id: `${el.type}/${el.id}`,
        url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        license: 'Open Database License (ODbL) 1.0',
        attribution: '© OpenStreetMap katkıcıları',
        updatedAt: t.check_date || null,
        fetchedAt,
      },
    ],
    conflicts: [],
  };
}

/* ───────────────────────── Birleştirme ───────────────────────── */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const norm = (s: string | null) => (s ?? '').toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/g, ' ').trim();
function similar(a: string | null, b: string | null) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x.includes(y) || y.includes(x)) return true;
  const tx = new Set(x.split(' ')), ty = y.split(' ');
  const common = ty.filter((w) => w.length > 2 && tx.has(w)).length;
  return common >= 2 || (common >= 1 && Math.min(tx.size, ty.length) <= 2);
}

/**
 * Aynı fiziksel istasyonu temsil eden kayıtları eşleştirir:
 *  - ≤ 30 m mesafe, ya da
 *  - ≤ 150 m mesafe ve isim/operatör benzerliği.
 * Birincil kayıt OCM'dir (soket/güç ayrıntısı genelde daha zengin). Eksik alanlar diğer kaynaktan doldurulur;
 * iki kaynakta farklı değer olan alanlar `conflicts` listesine yazılır, sessizce birleştirilmez.
 */
export function mergeStations(primary: Station[], secondary: Station[]): Station[] {
  const out = primary.map((s) => ({ ...s, sources: [...s.sources], conflicts: [...s.conflicts] }));
  for (const s of secondary) {
    const match = out.find((p) => {
      const d = distanceM(p, s);
      return d <= 30 || (d <= 150 && (similar(p.name, s.name) || similar(p.operator, s.operator)));
    });
    if (!match) {
      out.push(s);
      continue;
    }
    match.sources.push(...s.sources);
    const fill = <K extends 'name' | 'address' | 'city' | 'operator' | 'openingHours' | 'usageCost' | 'points'>(k: K) => {
      if (match[k] == null && s[k] != null) (match as Station)[k] = s[k] as Station[K];
      else if (match[k] != null && s[k] != null && norm(String(match[k])) !== norm(String(s[k])) && !(k === 'name' || k === 'operator' ? similar(String(match[k]), String(s[k])) : false)) {
        match.conflicts.push(`${k}: ${s.sources[0].provider.toUpperCase()} "${s[k]}"`);
      }
    };
    (['name', 'address', 'city', 'operator', 'openingHours', 'usageCost', 'points'] as const).forEach(fill);
    if (match.connectors.length === 0 && s.connectors.length) {
      match.connectors = s.connectors;
      match.maxPowerKw = s.maxPowerKw;
    } else if (match.maxPowerKw != null && s.maxPowerKw != null && Math.abs(match.maxPowerKw - s.maxPowerKw) >= 1) {
      match.conflicts.push(`maxPowerKw: OSM ${s.maxPowerKw} kW`);
    }
  }
  return out;
}

export function isDc(s: Station) {
  return s.connectors.some((c) => c.current === 'DC' || c.kind === 'CCS2' || c.kind === 'CHAdeMO');
}
