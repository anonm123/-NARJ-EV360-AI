/** Rota geometrisi yardımcıları (saf; birim testli). Koordinatlar [lng, lat] (GeoJSON sırası). */
export type LngLat = [number, number];

export function haversineKm(a: LngLat, b: LngLat) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Geometri boyunca kümülatif mesafe (km). Toplam, routing motorunun yol mesafesine ölçeklenir. */
export function cumulativeKm(coords: LngLat[], totalRoadKm?: number) {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversineKm(coords[i - 1], coords[i]));
  const geomTotal = cum[cum.length - 1] || 1;
  const k = totalRoadKm ? totalRoadKm / geomTotal : 1;
  return cum.map((c) => c * k);
}

/** Rota üzerinde belirli bir km'deki nokta (doğrusal ara değer). */
export function pointAtKm(coords: LngLat[], cum: number[], km: number): LngLat {
  if (km <= 0) return coords[0];
  for (let i = 1; i < cum.length; i++) {
    if (cum[i] >= km) {
      const t = (km - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      return [coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * t, coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * t];
    }
  }
  return coords[coords.length - 1];
}

/** Bir noktanın rotaya en yakın konumu: rota üzerindeki km ve rotadan sapma (km). */
export function projectOnRoute(coords: LngLat[], cum: number[], p: LngLat) {
  let best = { km: 0, offKm: Infinity };
  for (let i = 0; i < coords.length; i++) {
    const d = haversineKm(coords[i], p);
    if (d < best.offKm) best = { km: cum[i], offKm: d };
  }
  return best;
}

/** Ramer–Douglas–Peucker sadeleştirme (derece cinsinden tolerans). */
export function simplify(coords: LngLat[], tol = 0.002): LngLat[] {
  if (coords.length <= 2) return coords;
  const sq = (a: LngLat, b: LngLat, p: LngLat) => {
    const [x, y] = a, dx = b[0] - x, dy = b[1] - y;
    const l = dx * dx + dy * dy;
    let t = l ? ((p[0] - x) * dx + (p[1] - y) * dy) / l : 0;
    t = Math.max(0, Math.min(1, t));
    const ex = x + t * dx - p[0], ey = y + t * dy - p[1];
    return ex * ex + ey * ey;
  };
  const keep = new Uint8Array(coords.length);
  keep[0] = keep[coords.length - 1] = 1;
  const stack: [number, number][] = [[0, coords.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let max = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = sq(coords[s], coords[e], coords[i]);
      if (d > max) { max = d; idx = i; }
    }
    if (idx > 0 && max > tol * tol) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return coords.filter((_, i) => keep[i]);
}
