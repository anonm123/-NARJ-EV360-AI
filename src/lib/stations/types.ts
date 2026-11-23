/** Ortak (normalize) istasyon şeması. Bilinmeyen alanlar `null` — asla uydurulmaz. */
export type ProviderId = 'epdk' | 'ocm' | 'osm';
export type ConnectorKind = 'CCS2' | 'Type 2' | 'CHAdeMO' | 'Tesla' | 'Schuko' | 'Diğer';
export type CurrentKind = 'AC' | 'DC' | null;

export interface Connector {
  kind: ConnectorKind;
  label: string; // kaynaktaki özgün ad
  powerKw: number | null;
  current: CurrentKind;
  quantity: number | null;
}

export interface SourceRef {
  provider: ProviderId;
  id: string;
  url: string;
  license: string; // kayıt düzeyindeki lisans / atıf
  attribution: string;
  updatedAt: string | null; // kaynağın bildirdiği son güncelleme
  fetchedAt: string;
}

export interface Station {
  id: string; // `${provider}:${id}` (birleşik kayıtta birincil kaynağın kimliği)
  name: string | null;
  lat: number;
  lng: number;
  address: string | null;
  city: string | null;
  operator: string | null;
  connectors: Connector[];
  maxPowerKw: number | null;
  points: number | null;
  status: 'operational' | 'not_operational' | 'planned' | 'unknown';
  usageCost: string | null; // kaynakta metin olarak varsa; anlık fiyat değildir
  openingHours: string | null;
  access: string | null; // ör. EPDK hizmetSekli / OSM access; bilinmiyorsa null
  sources: SourceRef[];
  conflicts: string[]; // kaynaklar arasında çelişen alanlar (sessizce birleştirilmez)
}

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface ProviderResult {
  provider: ProviderId;
  ok: boolean;
  stations: Station[];
  error?: string;
  cached?: boolean;
}
