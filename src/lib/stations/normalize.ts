/** Saf normalizasyon fonksiyonları (sunucu/istemci bağımsız; birim testleri bunları kullanır). */
import type { Connector, ConnectorKind, CurrentKind, Station } from './types';

export function connectorKind(label: string): ConnectorKind {
  const l = label.toLocaleLowerCase('tr').replace(/[-_]/g, ' ').replace(/\btip\b/g, 'type');
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
    access: null,
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
    access: t.access || null,
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
 * Öncelik sırası çağıran tarafından verilir (EPDK → OCM → OSM). Eksik alanlar sonraki kaynaktan doldurulur;
 * iki kaynakta farklı değer olan alanlar `conflicts` listesine yazılır, sessizce birleştirilmez.
 */
export function mergeStations(primary: Station[], secondary: Station[]): Station[] {
  const out = primary.map((s) => ({ ...s, sources: [...s.sources], conflicts: [...s.conflicts] }));
  // Basit ızgara indeksi (~0,01° ≈ 1 km): binlerce kayıtta O(n²) taramayı önler
  const cell = (lat: number, lng: number) => `${Math.floor(lat * 100)}:${Math.floor(lng * 100)}`;
  const grid = new Map<string, Station[]>();
  const add = (st: Station) => {
    const k = cell(st.lat, st.lng);
    const list = grid.get(k);
    if (list) list.push(st);
    else grid.set(k, [st]);
  };
  out.forEach(add);
  const near = (st: Station) => {
    const la = Math.floor(st.lat * 100), ln = Math.floor(st.lng * 100);
    const res: Station[] = [];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) res.push(...(grid.get(`${la + i}:${ln + j}`) ?? []));
    return res;
  };
  for (const s of secondary) {
    const prov = s.sources[0]?.provider.toUpperCase() ?? '?';
    let best: Station | undefined;
    let bestD = Infinity;
    for (const p of near(s)) {
      const d = distanceM(p, s);
      if ((d <= 30 || (d <= 150 && (similar(p.name, s.name) || similar(p.operator, s.operator)))) && d < bestD) {
        best = p;
        bestD = d;
      }
    }
    const match = best;
    if (!match) {
      const copy = { ...s, sources: [...s.sources], conflicts: [...s.conflicts] };
      out.push(copy);
      add(copy);
      continue;
    }
    match.sources.push(...s.sources);
    const fill = <K extends 'name' | 'address' | 'city' | 'operator' | 'openingHours' | 'usageCost' | 'points' | 'access'>(k: K) => {
      if (match[k] == null && s[k] != null) (match as Station)[k] = s[k] as Station[K];
      else if (match[k] != null && s[k] != null && norm(String(match[k])) !== norm(String(s[k])) && !(k === 'name' || k === 'operator' ? similar(String(match[k]), String(s[k])) : false)) {
        match.conflicts.push(`${k}: ${prov} "${s[k]}"`);
      }
    };
    (['name', 'address', 'city', 'operator', 'openingHours', 'usageCost', 'points', 'access'] as const).forEach(fill);
    if (match.connectors.length === 0 && s.connectors.length) {
      match.connectors = s.connectors;
      match.maxPowerKw = s.maxPowerKw;
    } else if (match.maxPowerKw == null && s.maxPowerKw != null) {
      match.maxPowerKw = s.maxPowerKw;
    } else if (match.maxPowerKw != null && s.maxPowerKw != null && Math.abs(match.maxPowerKw - s.maxPowerKw) >= 1) {
      match.conflicts.push(`maxPowerKw: ${prov} ${s.maxPowerKw} kW`);
    }
    if (match.status === 'unknown' && s.status !== 'unknown') match.status = s.status;
  }
  return out;
}

export function isDc(s: Station) {
  return s.connectors.some((c) => c.current === 'DC' || c.kind === 'CCS2' || c.kind === 'CHAdeMO');
}

/* ───────────── EPDK — Şarj İstasyonları REST Web Servisi ─────────────
 * Kaynak: EPDK "Şarj İstasyonları ve Bu İstasyonlarda Yer Alan Soketlerin Sorgulanmasına Yönelik Web Servis
 * Kullanım Kılavuzu" (www.epdk.gov.tr → Web Servisler). Yanıt: { statusCode, columnNames[], numRows, data[] }.
 * Belgelenen sütunlar: sarjIstasyonuNo, sarjIstasyonuAdi, yesilSarjIstasyonuMu, hizmetSekli,
 * sarjAgiIsletmecisiUnvan, sarjAgiIsletmecisiLisansNo, sarjIstasyonuIsletmecisi, marka,
 * olumluGorusVerenDagitimSirketiLisansNo, olumluGorusVerenDagitimSirketiLisansUnvani, soketler, adres, enlem, boylam.
 * `soketler` alanının iç yapısı kılavuzda gösterilmediği için savunmacı çözümlenir; anlaşılamayan alan `null` kalır.
 */
export interface EpdkResponse {
  statusCode?: number;
  message?: string | null;
  columnNames?: string[];
  numRows?: number;
  data?: unknown[];
}

const EPDK_LIST_URL = 'https://lisans.epdk.gov.tr/epvys-web/faces/pages/lisans/elektrikSarjAgiIsletmeci/sarjIstasyonuOzetSorgula.xhtml';

/** Satır nesne ya da `columnNames` ile hizalı dizi olabilir; ikisini de nesneye çevirir. */
export function epdkRows(res: EpdkResponse): Record<string, unknown>[] {
  const cols = res.columnNames ?? [];
  return (res.data ?? []).flatMap((r) => {
    if (Array.isArray(r)) return [Object.fromEntries(cols.map((c, i) => [c, r[i]]))];
    if (r && typeof r === 'object') return [r as Record<string, unknown>];
    return [];
  });
}

function num(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const n = parseFloat(v.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null);

function currentOf(text: string): CurrentKind {
  const t = text.toUpperCase();
  if (/\bDC\b|CCS|CHADEMO|COMBO/.test(t)) return 'DC';
  if (/\bAC\b|TYPE ?2|TİP ?2|TIP ?2|MENNEKES|SCHUKO/.test(t)) return 'AC';
  return null;
}

/** Tek soket kaydı: nesne ise anahtar adlarından, metinse içeriğinden tip/güç/akım çıkarılır. */
export function epdkSocket(raw: unknown): Connector | null {
  if (raw == null) return null;
  let label = '';
  let powerKw: number | null = null;
  let current: CurrentKind = null;
  let quantity: number | null = null;
  if (typeof raw === 'string') {
    label = raw.trim();
    const m = label.match(/([\d.,]+)\s*kw/i);
    powerKw = m ? parsePowerKw(m[0]) : null;
    current = currentOf(label);
  } else if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const parts: string[] = [];
    for (const [k, v] of Object.entries(o)) {
      const key = k.toLocaleLowerCase('tr');
      if (v == null || typeof v === 'object') continue;
      if (/g[üu][çc]|kw|power/.test(key)) powerKw ??= parsePowerKw(typeof v === 'number' ? v : String(v));
      else if (/adet|sayi|sayı|count|quantity/.test(key)) quantity ??= num(v);
      else if (/ac.?dc|akim|akım|current/.test(key)) current ??= currentOf(String(v));
      else if (/tip|tur|tür|type|soket|standart|konnekt/.test(key)) parts.push(String(v).trim());
    }
    label = parts.filter(Boolean).join(' · ');
    current ??= currentOf(label);
  } else return null;
  if (!label && powerKw == null) return null;
  return { kind: connectorKind(label), label: label || 'Belirtilmemiş', powerKw, current, quantity };
}

export function normalizeEpdk(row: Record<string, unknown>, fetchedAt: string): Station | null {
  const lat = num(row.enlem);
  const lng = num(row.boylam);
  const id = str(row.sarjIstasyonuNo);
  if (lat == null || lng == null || !id) return null;
  if (lat < 35 || lat > 42.5 || lng < 25 || lng > 45.5) return null; // Türkiye dışı / hatalı koordinat
  let sockets: unknown[] = [];
  if (Array.isArray(row.soketler)) sockets = row.soketler;
  else if (typeof row.soketler === 'string' && row.soketler.trim()) {
    try {
      const parsed = JSON.parse(row.soketler);
      sockets = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      sockets = row.soketler.split(/[;|\n]/);
    }
  }
  const connectors = sockets.map(epdkSocket).filter((c): c is Connector => c !== null);
  return {
    id: `epdk:${id}`,
    name: str(row.sarjIstasyonuAdi),
    lat,
    lng,
    address: str(row.adres),
    city: null,
    operator: str(row.marka) ?? str(row.sarjAgiIsletmecisiUnvan),
    connectors,
    maxPowerKw: maxPower(connectors),
    points: null,
    status: 'unknown', // EPDK listesi lisans kaydıdır; anlık çalışma durumu içermez
    usageCost: null,
    openingHours: null,
    access: str(row.hizmetSekli),
    sources: [
      {
        provider: 'epdk',
        id,
        url: EPDK_LIST_URL,
        license: 'EPDK resmî web servisi (kamuya açık). Yazılı bir açık veri lisansı yayımlanmamıştır; ticari kullanım öncesi EPDK’dan teyit alınmalıdır.',
        attribution: `EPDK Şarj İstasyonları Listesi${str(row.sarjAgiIsletmecisiLisansNo) ? ` · Lisans ${str(row.sarjAgiIsletmecisiLisansNo)}` : ''}`,
        updatedAt: null,
        fetchedAt,
      },
    ],
    conflicts: [],
  };
}
