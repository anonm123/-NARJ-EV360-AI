/**
 * NAR-J Asistan — yerel, kural tabanlı niyet motoru (beta).
 * Yanıtlar platformun gerçek hesaplama fonksiyonlarından üretilir; uydurma canlı veri içermez.
 * Büyük dil modeli entegrasyonu yol haritasındadır (bkz. docs/ARCHITECTURE.md).
 */
import { CITIES } from '../data/cities';
import { VEHICLE_PROFILES } from '../data/vehicles';
import { SAMPLE_STATIONS } from '../data/stations';
import { planRoute } from '../calc/route';
import { computeCharge } from '../calc/charging';
import { computeCarbon } from '../calc/carbon';

export interface AssistantReply {
  text: string;
  links?: { href: string; label: string }[];
  intent: string;
}

const norm = (s: string) => s.toLocaleLowerCase('tr').normalize('NFC');
const fmtInt = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
const fmtDur = (m: number) => (m < 60 ? `${Math.round(m)} dk` : `${Math.floor(m / 60)} sa ${Math.round(m % 60)} dk`);

function findCities(t: string) {
  const hits: { idx: number; id: string }[] = [];
  for (const c of CITIES) {
    const n = norm(c.name);
    const i = t.indexOf(n);
    if (i >= 0) hits.push({ idx: i, id: c.id });
  }
  return hits.sort((a, b) => a.idx - b.idx).map((h) => CITIES.find((c) => c.id === h.id)!);
}

function findVehicle(t: string) {
  return VEHICLE_PROFILES.find((v) => t.includes(norm(v.name)) || t.includes(norm(v.segment))) ?? VEHICLE_PROFILES.find((v) => v.id === 'kompakt-suv')!;
}

const percents = (t: string) => [...t.matchAll(/%\s?(\d{1,3})|(\d{1,3})\s?%/g)].map((m) => Number(m[1] ?? m[2])).filter((n) => n >= 0 && n <= 100);

export function answer(input: string): AssistantReply {
  const t = norm(input.trim()).slice(0, 500);
  if (!t) return { intent: 'empty', text: 'Bir soru yazın; örneğin “İstanbul’dan Ankara’ya %70 ile gidebilir miyim?”' };
  const cities = findCities(t);
  const pct = percents(t);
  const vehicle = findVehicle(t);

  if (cities.length >= 2 || /rota|yolculuk|gidebilir|gitmek|varabilir/.test(t)) {
    if (cities.length < 2) return { intent: 'route-missing', text: 'Rota için başlangıç ve varış şehrini yazın. Örnek: “İzmir’den Antalya’ya %60 şarjla”.', links: [{ href: '/rota', label: 'Rota planlayıcıyı aç' }] };
    const [a, b] = cities;
    try {
      const p = planRoute({ from: a, to: b, batteryKwh: vehicle.batteryKwh, consumptionKwhPer100: vehicle.consumptionKwhPer100, maxDcKw: vehicle.maxDcKw, startSoc: pct[0] ?? 80, arrivalMinSoc: 15, mode: 'balanced', speedKmh: 110, tempC: 18, dcPricePerKwh: 13.9 });
      const stops = p.stops.length
        ? `${p.stops.length} şarj durağı öneriyorum (${p.stops.map((s) => `${s.nearCity} yakını`).join(', ')}).`
        : 'Şarj durağına gerek kalmadan varabilirsiniz.';
      return {
        intent: 'route',
        text: `${a.name} → ${b.name} için (${vehicle.name}, başlangıç %${pct[0] ?? 80}): kuş uçuşu tabanlı tahmini ${fmtInt(p.distanceKm)} km (gerçek karayolu planı için Rota Planlayıcı). ${stops} Toplam süre ≈ ${fmtDur(p.totalMinutes)}, şarj maliyeti ≈ ₺${fmtInt(p.totalCost)} ve varışta yaklaşık %${Math.round(p.arrivalSoc)} şarj kalır. Bu bir model tahminidir.`,
        links: [{ href: '/rota', label: 'Detaylı planla' }],
      };
    } catch (e) {
      return { intent: 'route-error', text: `Bu rota planlanamadı: ${(e as Error).message}`, links: [{ href: '/rota', label: 'Rota planlayıcı' }] };
    }
  }

  if (/maliyet|ücret|kaç para|ne kadar tutar|kaç tl|süre|dakika|şarj et/.test(t)) {
    const start = pct[0] ?? 20;
    const target = pct[1] ?? 80;
    if (target <= start) return { intent: 'charge-error', text: 'Hedef şarj seviyesi başlangıçtan büyük olmalı.' };
    const r = computeCharge({ batteryKwh: vehicle.batteryKwh, startSoc: start, targetSoc: target, chargerKw: /ac|ev|wallbox/.test(t) ? 11 : 120, vehicleMaxKw: /ac|ev|wallbox/.test(t) ? 11 : vehicle.maxDcKw, type: /ac|ev|wallbox/.test(t) ? 'AC' : 'DC', pricePerKwh: /ac|ev|wallbox/.test(t) ? 9.9 : 13.9, consumptionKwhPer100: vehicle.consumptionKwhPer100 });
    return {
      intent: 'charge',
      text: `${vehicle.name} için %${start} → %${target}: ≈ ${r.energyFromGridKwh.toFixed(1).replace('.', ',')} kWh, yaklaşık ₺${fmtInt(r.cost)} ve ${fmtDur(r.minutes)} (${/ac|ev|wallbox/.test(t) ? '11 kW AC' : '120 kW DC'}, örnek tarife). Yaklaşık ${fmtInt(r.rangeAddedKm)} km menzil eklenir.`,
      links: [{ href: '/hesaplayici', label: 'Hesaplayıcıda değiştir' }],
    };
  }

  if (/istasyon|şarj noktası|nerede|yakın/.test(t)) {
    const c = cities[0];
    const list = c ? SAMPLE_STATIONS.filter((s) => s.cityId === c.id) : [];
    if (!c) return { intent: 'station-missing', text: 'Hangi şehirde istasyon arıyorsunuz?', links: [{ href: '/harita', label: 'Haritayı aç' }] };
    const top = [...list].sort((a, b) => b.maxKw - a.maxKw).slice(0, 3);
    return {
      intent: 'station',
      text: `${c.name} için örnek veri setinde ${list.length} nokta var. En yüksek güçlüler: ${top.map((s) => `${s.name} (${s.maxKw} kW)`).join(', ')}. Not: Bunlar temsili noktalardır, gerçek istasyonlar değildir.`,
      links: [{ href: '/harita', label: 'Haritada gör' }],
    };
  }

  if (/karbon|co2|co₂|emisyon|çevre/.test(t)) {
    const r = computeCarbon({ kmPerYear: 15000, evKwhPer100: vehicle.consumptionKwhPer100, iceLitersPer100: 6.8, fuel: 'gasoline' });
    return { intent: 'carbon', text: `Yılda 15.000 km için ${vehicle.name}, benzinli muadiline göre yaklaşık ${fmtInt(r.savedKg)} kg CO₂ (%${fmtInt(r.savedPct)}) daha az emisyon üretir (şebeke faktörü ≈0,44 kg/kWh varsayımıyla).`, links: [{ href: '/analitik', label: 'Karbon analitiği' }] };
  }
  if (/abonelik|plan|fiyat|premium|ücretsiz/.test(t)) return { intent: 'pricing', text: 'Ücretsiz Sürücü planı harita ve hesaplayıcıyı içerir. Sürücü Plus sınırsız AI rota ve tek ödeme erken erişimi sunar; Filo planı araç başına fiyatlandırılır. Fiyatlar lansman öncesi önerilen değerlerdir.', links: [{ href: '/abonelik', label: 'Planları incele' }] };
  if (/rfid|kart|ödeme|cüzdan/.test(t)) return { intent: 'rfid', text: 'NAR-J Pass vizyonu: farklı operatörlerde tek RFID kart ve tek cüzdanla ödeme. Operatör anlaşmaları henüz yapılmadığı için bu özellik planlı aşamadadır.', links: [{ href: '/rfid', label: 'RFID vizyonu' }] };
  if (/filo|lojistik|kurumsal|şirket/.test(t)) return { intent: 'fleet', text: 'Filo panelinde araç bazlı şarj seviyesi, günlük km ve maliyet raporlarını görebilirsiniz. Demo filo hesabıyla panele girerek deneyebilirsiniz.', links: [{ href: '/filo', label: 'Filo çözümleri' }, { href: '/giris', label: 'Panele giriş' }] };
  if (/rezervasyon|ayır/.test(t)) return { intent: 'reservation', text: 'Rezervasyon akışı demo modundadır: istasyon, saat ve süre seçip test kartıyla (4242 4242 4242 4242) onaylayabilirsiniz. Gerçek ödeme alınmaz.', links: [{ href: '/rezervasyon', label: 'Rezervasyon demo' }] };
  if (/kvkk|gizlilik|veri/.test(t)) return { intent: 'privacy', text: 'Kişisel verileriniz KVKK kapsamında yalnızca hizmet için gerekli ölçüde işlenir; parolalar tek yönlü hash ile saklanır, kart bilgisi saklanmaz.', links: [{ href: '/yasal/kvkk', label: 'KVKK metni' }] };
  if (/merhaba|selam|yardım|neler yap/.test(t)) return { intent: 'help', text: 'Merhaba! Rota planlama (“Bursa’dan Konya’ya %60 ile”), şarj maliyeti (“%15’ten %80’e ne kadar tutar”), istasyon (“Ankara’da istasyon”) ve karbon tasarrufu hakkında yardımcı olabilirim.' };
  return { intent: 'fallback', text: 'Bunu henüz yanıtlayamıyorum. Rota, şarj maliyeti, istasyonlar, karbon, abonelik veya rezervasyon hakkında sorabilirsiniz.', links: [{ href: '/iletisim', label: 'Ekibe yazın' }] };
}
