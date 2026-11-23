#!/usr/bin/env node
/**
 * Canlı veri entegrasyon denetimi: çalışan bir NAR-J sunucusunun /api/stations ve /api/route uçlarını
 * gerçek kaynaklarla (EPDK, Open Charge Map, OpenStreetMap/Overpass, OSRM) sınar.
 * Ham veri yazdırılmaz; yalnızca sayılar, kaynak durumları ve süreler raporlanır.
 *   BASE_URL=http://localhost:3000 node scripts/live-check.mjs
 * GitHub Actions'ta sonuç "Job summary" bölümüne de yazılır.
 */
import fs from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CITIES = [
  { name: 'Konya', lat: 37.8746, lng: 32.4932 },
  { name: 'İstanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'Ankara', lat: 39.9334, lng: 32.8597 },
];
const ROUTES = [
  { name: 'Konya → Ankara', from: [32.4932, 37.8746], to: [32.8597, 39.9334], min: 240, max: 300 },
  { name: 'İstanbul → Ankara', from: [28.9784, 41.0082], to: [32.8597, 39.9334], min: 400, max: 480 },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lines = [];
const out = (s = '') => {
  console.log(s);
  lines.push(s);
};
let failed = 0;

async function stations(c) {
  const p = new URLSearchParams({ south: (c.lat - 0.25).toFixed(4), north: (c.lat + 0.25).toFixed(4), west: (c.lng - 0.3).toFixed(4), east: (c.lng + 0.3).toFixed(4) });
  const t = Date.now();
  const res = await fetch(`${BASE}/api/stations?${p}`);
  return { status: res.status, ms: Date.now() - t, body: await res.json() };
}

out('## Canlı veri denetimi');
out(`Tarih: ${new Date().toISOString()} · Sunucu: ${BASE}`);
out();
out('### İstasyonlar (şehir merkezi ±0,25°)');
out('| Şehir | Toplam | EPDK | Open Charge Map | OpenStreetMap | DC | Çok kaynaklı | Çakışmalı |');
out('|---|---|---|---|---|---|---|---|');
for (const c of CITIES) {
  let r = await stations(c);
  // EPDK tüm listeyi ilk istekte indirir (~13 MB); hazır olana kadar en fazla 3 dk bekle
  for (let i = 0; i < 9 && r.body.providers?.find((p) => p.provider === 'epdk' && !p.ok && /indiriliyor/.test(p.error ?? '')); i++) {
    await sleep(20_000);
    r = await stations(c);
  }
  if (r.status !== 200) {
    failed++;
    out(`| ${c.name} | HTTP ${r.status} | | | | | | |`);
    continue;
  }
  const cell = (id) => {
    const p = r.body.providers.find((x) => x.provider === id);
    return !p ? '—' : p.ok ? `✅ ${p.count}${p.error ? ` (${p.error})` : ''}` : `❌ ${p.error}`;
  };
  const st = r.body.stations;
  const dc = st.filter((s) => s.connectors.some((k) => k.current === 'DC' || k.kind === 'CCS2' || k.kind === 'CHAdeMO')).length;
  const multi = st.filter((s) => new Set(s.sources.map((x) => x.provider)).size > 1).length;
  const conf = st.filter((s) => s.conflicts.length).length;
  if (!r.body.providers.some((p) => p.ok)) failed++;
  out(`| ${c.name} | ${st.length} | ${cell('epdk')} | ${cell('ocm')} | ${cell('osm')} | ${dc} | ${multi} | ${conf} |`);
}

out();
out('### Karayolu rotası (OSRM)');
out('| Rota | Sonuç | Süre | Beklenen |');
out('|---|---|---|---|');
for (const r of ROUTES) {
  const res = await fetch(`${BASE}/api/route?from=${r.from.join(',')}&to=${r.to.join(',')}`);
  const b = await res.json();
  if (res.ok && b.distanceKm >= r.min && b.distanceKm <= r.max) out(`| ${r.name} | ✅ ${b.distanceKm.toFixed(1)} km${b.demoServer ? ' (demo sunucu)' : ''} | ${Math.round(b.durationMin)} dk | ${r.min}–${r.max} km |`);
  else {
    failed++;
    out(`| ${r.name} | ❌ ${res.ok ? `${b.distanceKm} km (aralık dışı)` : `HTTP ${res.status}: ${b.error ?? ''}`} | | ${r.min}–${r.max} km |`);
  }
}

out();
out('### Rota koridoru istasyonları (≤5 km)');
for (const r of ROUTES) {
  const t = Date.now();
  const res = await fetch(`${BASE}/api/route/stations?from=${r.from.join(',')}&to=${r.to.join(',')}`);
  const b = await res.json();
  if (!res.ok) {
    failed++;
    out(`- ${r.name}: ❌ HTTP ${res.status} ${b.error ?? ''}`);
    continue;
  }
  const dc = b.stations.filter((s) => s.connectors.some((k) => k.current === 'DC' || k.kind === 'CCS2' || k.kind === 'CHAdeMO')).length;
  out(`- ${r.name}: ${b.stations.length} istasyon (${dc} DC) · ${Date.now() - t} ms · ` + b.providers.map((p) => `${p.provider}: ${p.ok ? p.count : '❌ ' + p.error}`).join(', '));
}

out();
out(failed ? `**${failed} kontrol başarısız.**` : '**Tüm kontroller geçti.**');
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
process.exit(failed ? 1 : 0);
