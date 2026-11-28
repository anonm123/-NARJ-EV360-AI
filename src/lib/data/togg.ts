/**
 * Togg araç kataloğu — web ve mobil uygulamada ORTAK veri kaynağı.
 *
 * Kurallar (değiştirmeyin):
 *  - Her teknik değer bir `Spec` olarak, durum etiketi ve kaynak bağlantısıyla tutulur.
 *  - Resmî kaynakta bulunmayan değer UYDURULMAZ: `value: null, status: 'dogrulanamadi'`.
 *  - NAR-J'nin hesapladığı değerler (`tahmini`) resmî verilerden ayrı tutulur ve yöntemi yazılır.
 *  - NAR-J, Togg'dan bağımsız bir platformdur; Togg ile resmî ortaklık/iş birliği yoktur.
 *    "Togg", "T10X", "T10F" ve renk adları Togg'un ticari markalarıdır; yalnızca araç tanımlamak için kullanılır.
 *
 * Doğrulama tarihi: 28.11.2026 — Togg resmî web sitesi, konfigüratörü ve fiyat listeleri (aşağıdaki SOURCES).
 * Togg değerleri zaman içinde güncelleyebilir; yayın öncesi konfigüratörden tekrar kontrol edilmelidir.
 */

export type SpecStatus =
  /** Togg resmî kaynağında bu sürüm için açıkça yazıyor. */
  | 'resmi'
  /** Togg resmî kaynağında model geneli için yazıyor (sürüme özgü değil). */
  | 'resmi-genel'
  /** Togg resmî kaynakları arasında farklı değerler var; tümü gösterilir. */
  | 'celiskili'
  /** Resmî kaynakta değer var ancak hangi sürüme ait olduğu açıkça belirtilmiyor. */
  | 'surum-teyitsiz'
  /** Resmî sürüm verisi yok; aynı platformdaki resmî değer hesaplama için varsayıldı (NAR-J varsayımı). */
  | 'varsayim'
  /** NAR-J tarafından resmî verilerden hesaplanan tahmin. */
  | 'tahmini'
  /** Resmî kaynakta bulunamadı — değer gösterilmez. */
  | 'dogrulanamadi';

export const SPEC_STATUS_LABEL: Record<SpecStatus, string> = {
  resmi: 'Resmî',
  'resmi-genel': 'Resmî · model geneli',
  celiskili: 'Resmî kaynaklarda çelişkili',
  'surum-teyitsiz': 'Resmî · sürüm teyitsiz',
  varsayim: 'NAR-J varsayımı',
  tahmini: 'NAR-J tahmini',
  dogrulanamadi: 'Doğrulanamadı',
};

export interface Spec<T = number> {
  value: T | null;
  status: SpecStatus;
  /** Kaynak anahtarı (SOURCES). */
  source?: SourceKey;
  /** Kullanıcıya gösterilen kısa açıklama (çelişki, kapsam, yöntem). */
  note?: string;
}

export const SOURCES = {
  t10xPage: { label: 'Togg T10X sayfası', url: 'https://www.togg.com.tr/en/t10x' },
  t10xConfig: { label: 'Togg konfigüratörü · T10X', url: 'https://configurator.togg.com.tr/t10x' },
  t10xObsidian: { label: 'Togg T10X 4More Obsidiyen sayfası', url: 'https://www.togg.com.tr/en/t10x-4more-obsidian' },
  t10xPrices: { label: 'Togg T10X fiyat listesi', url: 'https://www.togg.com.tr/en/price-list' },
  t10fPage: { label: 'Togg T10F sayfası', url: 'https://www.togg.com.tr/en/t10f' },
  t10fConfig: { label: 'Togg konfigüratörü · T10F', url: 'https://configurator.togg.com.tr/t10f' },
  t10fPrices: { label: 'Togg T10F fiyat listesi', url: 'https://www.togg.com.tr/en/t10f-price-list' },
  configPress: { label: 'Togg konfigüratörü · basın sayfası', url: 'https://configurator.togg.com.tr/press/1B7BD657-5D2A-43D6-9C98-21AE5AB735C2' },
  faq: { label: 'Togg sıkça sorulan sorular', url: 'https://www.togg.com.tr/en/faq' },
  mediaT10x: { label: 'Togg Medya Merkezi · T10X', url: 'https://mediacenter.togg.com.tr/tr/t10x' },
} as const;
export type SourceKey = keyof typeof SOURCES;

export const SPECS_VERIFIED_AT = '2026-11-28';

/* ───────────────────────── Renkler ───────────────────────── */

export interface ToggColor {
  id: string;
  name: string;
  /** İlham kaynağı (Togg'un resmî anlatımından). */
  story?: string;
  /**
   * Arayüzde ışık ve renk örneği için kullanılan TEMSİLÎ ton. Togg resmî renk kodu yayımlamadığından
   * gerçek boya rengiyle birebir aynı değildir; arayüzde "temsilî ton" olarak belirtilir.
   */
  swatch: string;
  /** Metalik ışık yansıması için açık ton (temsilî). */
  glow: string;
}

export const TOGG_COLORS: Record<string, ToggColor> = {
  ayder: { id: 'ayder', name: 'Ayder', story: 'Kaçkarların sisli yaylaları ve derin yeşil vadileri', swatch: '#2F5E4E', glow: '#5FA88E' },
  gemlik: { id: 'gemlik', name: 'Gemlik', story: 'Marmara kıyısındaki zeytinlikler', swatch: '#5E6142', glow: '#A4A774' },
  anadolu: { id: 'anadolu', name: 'Anadolu', story: 'Anadolu toprağının sıcak tonları', swatch: '#8E2F24', glow: '#D9634F' },
  kula: { id: 'kula', name: 'Kula', story: "Manisa'nın volkanik arazisi", swatch: '#3B3D42', glow: '#8A8F99' },
  kapadokya: { id: 'kapadokya', name: 'Kapadokya', story: 'Peri bacalarının toprak tonları', swatch: '#B49A80', glow: '#E8D2BA' },
  oltu: { id: 'oltu', name: 'Oltu', story: "Erzurum'un siyah Oltu taşı", swatch: '#16171A', glow: '#5C6270' },
  seyhan: { id: 'seyhan', name: 'Seyhan', story: 'Çukurova pamuk tarlaları', swatch: '#E9E8E3', glow: '#FFFFFF' },
  urla: { id: 'urla', name: 'Urla', story: '“Colours of Türkiye” serisinin T10F ile gelen rengi', swatch: '#3E6E8E', glow: '#7DB4D6' },
  mardin: { id: 'mardin', name: 'Mardin', story: '“Colours of Türkiye” serisinin T10F ile gelen rengi', swatch: '#B8915C', glow: '#E9C894' },
};

/* ───────────────────────── Sürümler ───────────────────────── */

export type ToggModel = 'T10X' | 'T10F';
export type Drive = 'RWD' | 'AWD';

export interface ToggVersion {
  id: string;
  model: ToggModel;
  /** Togg'un sürüm adı. */
  version: string;
  /** Tam görünen ad. */
  name: string;
  body: 'C-SUV' | 'Fastback (sedan)';
  drive: Drive;
  driveLabel: string;
  specs: {
    batteryKwh: Spec;
    wltpRangeKm: Spec;
    consumptionKwhPer100: Spec;
    maxDcKw: Spec;
    maxAcKw: Spec;
    /** %20 → %80 DC hızlı şarj süresi (dk). */
    dcCharge20to80Min: Spec;
    powerKw: Spec;
    powerPs: Spec;
    torqueNm: Spec;
    accel0to100s: Spec;
    sockets: Spec<string>;
  };
  /** Bu sürümde resmî kaynakta doğrulanan renkler. */
  colors: string[];
  colorsStatus: SpecStatus;
  colorsNote?: string;
  /** Resmî fiyat listesinde yer alıyor (satışta). */
  listedIn: SourceKey;
}

const SOCKETS: Spec<string> = {
  value: 'CCS2 (DC) · Type 2 (AC)',
  status: 'varsayim',
  note: 'Türkiye ve AB\'de standart soket tipi; Togg kaynaklarında ayrıca sürüm bazında teyit edilmedi.',
};
const DC_GENERAL: Spec = { value: 180, status: 'resmi-genel', source: 't10xPage', note: 'Togg T10X sayfası: 180 kW DC şarj kapasitesi.' };
const AC_GENERAL: Spec = { value: 22, status: 'resmi-genel', source: 't10xPage', note: 'Togg T10X sayfası: 22 kW AC şarj kapasitesi (standart/opsiyon ayrımı belirtilmiyor).' };
const NONE: Spec = { value: null, status: 'dogrulanamadi' };
const T10X_COLORS = ['anadolu', 'gemlik', 'oltu', 'kula', 'kapadokya', 'ayder', 'seyhan'];

export const TOGG_VERSIONS: ToggVersion[] = [
  {
    id: 't10x-v1-rwd-std',
    model: 'T10X',
    version: 'V1 RWD Standart Menzil',
    name: 'Togg T10X V1 Standart Menzil',
    body: 'C-SUV',
    drive: 'RWD',
    driveLabel: 'Arkadan itiş (RWD)',
    specs: {
      batteryKwh: { value: 54.6, status: 'surum-teyitsiz', source: 'configPress', note: 'Konfigüratör basın sayfası 54,6 kWh / 314 km gösteriyor ancak sürüm adını belirtmiyor.' },
      wltpRangeKm: { value: 314, status: 'surum-teyitsiz', source: 'configPress' },
      consumptionKwhPer100: NONE,
      maxDcKw: { ...DC_GENERAL, note: 'Model geneli değer; Standart Menzil bataryasında tepe gücü farklı olabilir.' },
      maxAcKw: AC_GENERAL,
      dcCharge20to80Min: NONE,
      powerKw: { value: 160, status: 'surum-teyitsiz', source: 'configPress' },
      powerPs: { value: 218, status: 'surum-teyitsiz', source: 'configPress' },
      torqueNm: NONE,
      accel0to100s: { value: 7.4, status: 'resmi-genel', source: 't10xPage', note: 'Togg: arkadan itiş seçeneğiyle 0-100 km/s 7,4 sn (sürüme özgü değil).' },
      sockets: SOCKETS,
    },
    colors: T10X_COLORS,
    colorsStatus: 'resmi-genel',
    colorsNote: 'T10X için resmî 7 renk; sürüm bazında renk kısıtı yayımlanmadı.',
    listedIn: 't10xPrices',
  },
  {
    id: 't10x-v1-rwd-long',
    model: 'T10X',
    version: 'V1 RWD Uzun Menzil',
    name: 'Togg T10X V1 Uzun Menzil',
    body: 'C-SUV',
    drive: 'RWD',
    driveLabel: 'Arkadan itiş (RWD)',
    specs: {
      batteryKwh: { value: 89.6, status: 'resmi', source: 't10xConfig' },
      wltpRangeKm: { value: 523, status: 'resmi', source: 't10xConfig' },
      consumptionKwhPer100: { value: 19.7, status: 'resmi', source: 't10xConfig', note: 'Konfigüratördeki enerji tüketimi değeri (WLTP).' },
      maxDcKw: DC_GENERAL,
      maxAcKw: AC_GENERAL,
      dcCharge20to80Min: { value: 26.5, status: 'resmi', source: 't10xConfig' },
      powerKw: { value: 160, status: 'resmi', source: 't10xConfig' },
      powerPs: { value: 218, status: 'resmi', source: 't10xConfig' },
      torqueNm: { value: 350, status: 'resmi', source: 't10xConfig' },
      accel0to100s: { value: 7.4, status: 'resmi-genel', source: 't10xPage', note: 'Togg: arkadan itiş seçeneğiyle 0-100 km/s 7,4 sn.' },
      sockets: SOCKETS,
    },
    colors: T10X_COLORS,
    colorsStatus: 'resmi-genel',
    colorsNote: 'T10X için resmî 7 renk; sürüm bazında renk kısıtı yayımlanmadı.',
    listedIn: 't10xPrices',
  },
  {
    id: 't10x-v2-rwd-long',
    model: 'T10X',
    version: 'V2 RWD Uzun Menzil',
    name: 'Togg T10X V2 Uzun Menzil',
    body: 'C-SUV',
    drive: 'RWD',
    driveLabel: 'Arkadan itiş (RWD)',
    specs: {
      batteryKwh: { value: 89.6, status: 'varsayim', source: 't10xConfig', note: 'Sürüme özgü resmî veri bulunamadı; aynı adlı Uzun Menzil bataryası (89,6 kWh) varsayıldı.' },
      wltpRangeKm: { value: null, status: 'dogrulanamadi', note: 'V2 donanımının menzile etkisi resmî kaynakta sürüm bazında yayımlanmadı.' },
      consumptionKwhPer100: NONE,
      maxDcKw: DC_GENERAL,
      maxAcKw: AC_GENERAL,
      dcCharge20to80Min: NONE,
      powerKw: { value: 160, status: 'varsayim', note: 'RWD Uzun Menzil güç aktarma organı varsayıldı.' },
      powerPs: { value: 218, status: 'varsayim' },
      torqueNm: { value: 350, status: 'varsayim' },
      accel0to100s: { value: 7.4, status: 'resmi-genel', source: 't10xPage', note: 'Togg: arkadan itiş seçeneğiyle 0-100 km/s 7,4 sn.' },
      sockets: SOCKETS,
    },
    colors: T10X_COLORS,
    colorsStatus: 'resmi-genel',
    colorsNote: 'T10X için resmî 7 renk; sürüm bazında renk kısıtı yayımlanmadı.',
    listedIn: 't10xPrices',
  },
  {
    id: 't10x-v2-4more',
    model: 'T10X',
    version: 'V2 4More Obsidiyen',
    name: 'Togg T10X V2 4More Obsidiyen',
    body: 'C-SUV',
    drive: 'AWD',
    driveLabel: 'Dört tekerden çekiş (4More)',
    specs: {
      batteryKwh: { value: 89.6, status: 'resmi', source: 't10xConfig' },
      wltpRangeKm: { value: 468, status: 'resmi', source: 't10xConfig' },
      consumptionKwhPer100: { value: 22.3, status: 'resmi', source: 't10xConfig', note: 'Konfigüratördeki enerji tüketimi değeri (WLTP).' },
      maxDcKw: DC_GENERAL,
      maxAcKw: AC_GENERAL,
      dcCharge20to80Min: NONE,
      powerKw: { value: 320, status: 'resmi', source: 't10xConfig' },
      powerPs: { value: 435, status: 'resmi', source: 't10xConfig' },
      torqueNm: { value: 700, status: 'resmi', source: 't10xConfig' },
      accel0to100s: { value: 4.5, status: 'resmi', source: 't10xConfig' },
      sockets: SOCKETS,
    },
    colors: ['ayder', 'anadolu', 'kula', 'oltu', 'seyhan'],
    colorsStatus: 'resmi',
    colorsNote: 'Togg 4More Obsidiyen sayfası: Ayder, Anadolu, Kula, Oltu ve Seyhan.',
    listedIn: 't10xPrices',
  },
  {
    id: 't10f-v1-rwd-std',
    model: 'T10F',
    version: 'V1 RWD Standart Menzil',
    name: 'Togg T10F V1 Standart Menzil',
    body: 'Fastback (sedan)',
    drive: 'RWD',
    driveLabel: 'Arkadan itiş (RWD)',
    specs: {
      batteryKwh: { value: 54.6, status: 'varsayim', note: 'T10F Standart Menzil için resmî batarya değeri bulunamadı; T10X Standart Menzil değeri varsayıldı.' },
      wltpRangeKm: NONE,
      consumptionKwhPer100: NONE,
      maxDcKw: { value: 180, status: 'varsayim', note: 'T10X model geneli değer varsayıldı.' },
      maxAcKw: { value: 22, status: 'varsayim', note: 'T10X model geneli değer varsayıldı.' },
      dcCharge20to80Min: NONE,
      powerKw: { value: 160, status: 'varsayim', note: 'RWD güç aktarma organı varsayıldı.' },
      powerPs: { value: 218, status: 'varsayim' },
      torqueNm: NONE,
      accel0to100s: NONE,
      sockets: SOCKETS,
    },
    colors: ['urla', 'mardin', 'ayder'],
    colorsStatus: 'resmi-genel',
    colorsNote: 'Resmî kaynakta T10F için doğrulanan renkler: Urla, Mardin (yeni) ve Ayder. Tam liste için Togg konfigüratörüne bakın.',
    listedIn: 't10fPrices',
  },
  {
    id: 't10f-v1-rwd-long',
    model: 'T10F',
    version: 'V1 RWD Uzun Menzil',
    name: 'Togg T10F V1 Uzun Menzil',
    body: 'Fastback (sedan)',
    drive: 'RWD',
    driveLabel: 'Arkadan itiş (RWD)',
    specs: {
      batteryKwh: { value: 89.6, status: 'varsayim', source: 't10fConfig', note: 'T10F Uzun Menzil bataryası (89,6 kWh) varsayıldı.' },
      wltpRangeKm: { value: 623, status: 'surum-teyitsiz', source: 't10fPage', note: 'Togg T10F sayfası "623 km\'ye kadar" diyor; hangi sürüme ait olduğu belirtilmiyor.' },
      consumptionKwhPer100: NONE,
      maxDcKw: { value: 180, status: 'varsayim', note: 'T10X model geneli değer varsayıldı.' },
      maxAcKw: { value: 22, status: 'varsayim', note: 'T10X model geneli değer varsayıldı.' },
      dcCharge20to80Min: { value: 26.5, status: 'varsayim', note: 'T10F V2 RWD Uzun Menzil için resmî 26,5 dk varsayıldı.' },
      powerKw: { value: 160, status: 'varsayim' },
      powerPs: { value: 218, status: 'varsayim' },
      torqueNm: { value: 350, status: 'varsayim' },
      accel0to100s: NONE,
      sockets: SOCKETS,
    },
    colors: ['urla', 'mardin', 'ayder'],
    colorsStatus: 'resmi-genel',
    colorsNote: 'Resmî kaynakta T10F için doğrulanan renkler: Urla, Mardin (yeni) ve Ayder. Tam liste için Togg konfigüratörüne bakın.',
    listedIn: 't10fPrices',
  },
  {
    id: 't10f-v2-rwd-long',
    model: 'T10F',
    version: 'V2 RWD Uzun Menzil',
    name: 'Togg T10F V2 Uzun Menzil',
    body: 'Fastback (sedan)',
    drive: 'RWD',
    driveLabel: 'Arkadan itiş (RWD)',
    specs: {
      batteryKwh: { value: 89.6, status: 'resmi', source: 't10fConfig' },
      wltpRangeKm: { value: 610, status: 'resmi', source: 't10fConfig' },
      consumptionKwhPer100: NONE,
      maxDcKw: { value: 180, status: 'varsayim', note: 'T10X model geneli değer varsayıldı.' },
      maxAcKw: { value: 22, status: 'varsayim', note: 'T10X model geneli değer varsayıldı.' },
      dcCharge20to80Min: { value: 26.5, status: 'resmi', source: 't10fConfig' },
      powerKw: { value: 160, status: 'resmi', source: 't10fConfig' },
      powerPs: { value: 218, status: 'varsayim', note: '160 kW = 218 PS (birim dönüşümü).' },
      torqueNm: { value: 350, status: 'resmi', source: 't10fConfig' },
      accel0to100s: NONE,
      sockets: SOCKETS,
    },
    colors: ['urla', 'mardin', 'ayder'],
    colorsStatus: 'resmi-genel',
    colorsNote: 'Resmî kaynakta T10F için doğrulanan renkler: Urla, Mardin (yeni) ve Ayder. Tam liste için Togg konfigüratörüne bakın.',
    listedIn: 't10fPrices',
  },
  {
    id: 't10f-v2-4more',
    model: 'T10F',
    version: 'V2 4More',
    name: 'Togg T10F V2 4More',
    body: 'Fastback (sedan)',
    drive: 'AWD',
    driveLabel: 'Dört tekerden çekiş (4More)',
    specs: {
      batteryKwh: { value: 89.6, status: 'varsayim', note: 'T10F Uzun Menzil bataryası (89,6 kWh) varsayıldı.' },
      wltpRangeKm: { value: 500, status: 'celiskili', source: 't10fConfig', note: 'Konfigüratör 500 km, Togg T10F sayfası 523 km (WLTP) gösteriyor. Hesaplarda düşük değer (500 km) kullanılır.' },
      consumptionKwhPer100: NONE,
      maxDcKw: { value: 180, status: 'varsayim', note: 'T10X model geneli değer varsayıldı.' },
      maxAcKw: { value: 22, status: 'varsayim', note: 'T10X model geneli değer varsayıldı.' },
      dcCharge20to80Min: NONE,
      powerKw: { value: 320, status: 'resmi', source: 't10fPage' },
      powerPs: { value: 435, status: 'resmi', source: 't10fPage' },
      torqueNm: { value: 700, status: 'resmi', source: 't10fPage' },
      accel0to100s: { value: 4.1, status: 'resmi', source: 't10fPage' },
      sockets: SOCKETS,
    },
    colors: ['urla', 'mardin', 'ayder'],
    colorsStatus: 'resmi-genel',
    colorsNote: 'Resmî kaynakta T10F için doğrulanan renkler: Urla, Mardin (yeni) ve Ayder. Tam liste için Togg konfigüratörüne bakın.',
    listedIn: 't10fPrices',
  },
];

export const DEFAULT_TOGG_ID = 't10x-v1-rwd-long';
export const toggById = (id: string) => TOGG_VERSIONS.find((v) => v.id === id);

/* ───────────────────────── NAR-J tahminleri ───────────────────────── */

/** Karma kullanım ve ılıman hava için WLTP'ye uygulanan gerçek kullanım katsayısı (NAR-J varsayımı). */
export const REAL_WORLD_FACTOR = 0.85;

/**
 * Hesap motorlarında kullanılacak tüketim (kWh/100 km).
 * Resmî tüketim varsa o; yoksa resmî/teyitsiz batarya ve WLTP menzilinden gerçek kullanım katsayısıyla türetilir;
 * o da yoksa aynı modelin resmî tüketimi varsayılır.
 */
export function consumptionFor(v: ToggVersion): Spec {
  const c = v.specs.consumptionKwhPer100;
  if (c.value != null) return c;
  const b = v.specs.batteryKwh.value;
  const r = v.specs.wltpRangeKm.value;
  if (b != null && r != null) {
    return { value: +((b / (r * REAL_WORLD_FACTOR)) * 100).toFixed(1), status: 'tahmini', note: `Batarya ÷ (WLTP menzil × ${REAL_WORLD_FACTOR}) ile hesaplandı.` };
  }
  const sibling = TOGG_VERSIONS.find((x) => x.model === v.model && x.drive === v.drive && x.specs.consumptionKwhPer100.value != null)
    ?? TOGG_VERSIONS.find((x) => x.drive === v.drive && x.specs.consumptionKwhPer100.value != null)!;
  return { value: sibling.specs.consumptionKwhPer100.value, status: 'tahmini', note: `Resmî veri yok; ${sibling.name} resmî tüketimi varsayıldı.` };
}

/** Tahmini gerçek kullanım menzili (km). */
export function realRangeFor(v: ToggVersion): Spec {
  const r = v.specs.wltpRangeKm.value;
  if (r != null) return { value: Math.round(r * REAL_WORLD_FACTOR), status: 'tahmini', note: `WLTP × ${REAL_WORLD_FACTOR} (karma kullanım, ılıman hava).` };
  const b = v.specs.batteryKwh.value;
  const c = consumptionFor(v).value;
  if (b != null && c != null) return { value: Math.round((b / c) * 100), status: 'tahmini', note: 'Batarya ÷ tahmini tüketim ile hesaplandı.' };
  return NONE;
}
