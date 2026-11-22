// Türkiye il merkezleri (yaklaşık koordinatlar, kamuya açık coğrafi bilgi).
export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const CITIES: City[] = [
  { id: 'istanbul', name: 'İstanbul', lat: 41.0082, lng: 28.9784 },
  { id: 'ankara', name: 'Ankara', lat: 39.9334, lng: 32.8597 },
  { id: 'izmir', name: 'İzmir', lat: 38.4237, lng: 27.1428 },
  { id: 'bursa', name: 'Bursa', lat: 40.1885, lng: 29.061 },
  { id: 'antalya', name: 'Antalya', lat: 36.8969, lng: 30.7133 },
  { id: 'adana', name: 'Adana', lat: 37.0, lng: 35.3213 },
  { id: 'konya', name: 'Konya', lat: 37.8746, lng: 32.4932 },
  { id: 'gaziantep', name: 'Gaziantep', lat: 37.0662, lng: 37.3833 },
  { id: 'kayseri', name: 'Kayseri', lat: 38.7205, lng: 35.4826 },
  { id: 'eskisehir', name: 'Eskişehir', lat: 39.7767, lng: 30.5206 },
  { id: 'samsun', name: 'Samsun', lat: 41.2867, lng: 36.33 },
  { id: 'trabzon', name: 'Trabzon', lat: 41.0027, lng: 39.7168 },
  { id: 'erzurum', name: 'Erzurum', lat: 39.9043, lng: 41.2679 },
  { id: 'diyarbakir', name: 'Diyarbakır', lat: 37.9144, lng: 40.2306 },
  { id: 'mersin', name: 'Mersin', lat: 36.8121, lng: 34.6415 },
  { id: 'denizli', name: 'Denizli', lat: 37.7765, lng: 29.0864 },
  { id: 'mugla', name: 'Muğla', lat: 37.2153, lng: 28.3636 },
  { id: 'sakarya', name: 'Sakarya', lat: 40.7569, lng: 30.3783 },
  { id: 'kocaeli', name: 'Kocaeli', lat: 40.8533, lng: 29.8815 },
  { id: 'edirne', name: 'Edirne', lat: 41.6818, lng: 26.5623 },
  { id: 'afyonkarahisar', name: 'Afyonkarahisar', lat: 38.7507, lng: 30.5567 },
  { id: 'sivas', name: 'Sivas', lat: 39.7477, lng: 37.0179 },
  { id: 'van', name: 'Van', lat: 38.4891, lng: 43.4089 },
  { id: 'malatya', name: 'Malatya', lat: 38.3552, lng: 38.3095 },
  { id: 'sanliurfa', name: 'Şanlıurfa', lat: 37.1591, lng: 38.7969 },
  { id: 'bolu', name: 'Bolu', lat: 40.735, lng: 31.6061 },
  { id: 'canakkale', name: 'Çanakkale', lat: 40.1553, lng: 26.4142 },
  { id: 'aydin', name: 'Aydın', lat: 37.856, lng: 27.8416 },
  { id: 'balikesir', name: 'Balıkesir', lat: 39.6484, lng: 27.8826 },
  { id: 'kastamonu', name: 'Kastamonu', lat: 41.3887, lng: 33.7827 },
];

export const cityById = (id: string) => CITIES.find((c) => c.id === id);

/** Büyük daire mesafesi (km). */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Karayolu mesafesi tahmini: kuş uçuşu × yol katsayısı. Gerçek navigasyon verisi değildir. */
export const ROAD_FACTOR = 1.22;
export const estimateRoadKm = (a: City, b: City) => haversineKm(a, b) * ROAD_FACTOR;

export function nearestCity(p: { lat: number; lng: number }) {
  let best = CITIES[0];
  let bestD = Infinity;
  for (const c of CITIES) {
    const d = haversineKm(p, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return { city: best, km: bestD };
}
