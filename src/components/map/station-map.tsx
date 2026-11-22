'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Feature } from 'geojson';
import { STATUS_LABEL, type Station } from '@/lib/data/stations';

const COLORS = { available: '#00E5D4', busy: '#FFB547', offline: '#6C819A' } as const;
const GLYPH = { available: '⚡', busy: '•••', offline: '✕' } as const;

function icon(s: Station, selected: boolean) {
  const c = COLORS[s.demoStatus];
  const size = selected ? 40 : s.maxKw >= 150 ? 32 : 28;
  return L.divIcon({
    className: 'narj-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${c};color:#050A12;font:700 ${size > 30 ? 13 : 11}px/1 system-ui;border:3px solid #050A12;box-shadow:0 0 0 ${selected ? 4 : 2}px ${c}55,0 6px 16px rgba(0,0,0,.5)">${GLYPH[s.demoStatus]}</span>`,
  });
}

function FitTurkey() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[35.8, 25.9], [42.1, 44.8]], { padding: [8, 8] });
  }, [map]);
  return null;
}

function FlyTo({ target }: { target: Station | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 11, { duration: 0.9 });
  }, [target, map]);
  return null;
}

export default function StationMap({ stations, outline, selected, onSelect }: { stations: Station[]; outline: Feature; selected: Station | null; onSelect: (s: Station) => void }) {
  const icons = useMemo(() => new Map(stations.map((s) => [s.id, icon(s, s.id === selected?.id)])), [stations, selected]);
  return (
    <MapContainer center={[39.1, 35.2]} zoom={6} minZoom={4} zoomSnap={0.25} maxZoom={16} scrollWheelZoom={false} className="size-full" attributionControl>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
      />
      <GeoJSON data={outline} style={{ color: '#00B8FF', weight: 1.5, opacity: 0.6, fillColor: '#0c1a2b', fillOpacity: 0.35 }} interactive={false} />
      <FitTurkey />
      <FlyTo target={selected} />
      {stations.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={icons.get(s.id)!} eventHandlers={{ click: () => onSelect(s) }} title={`${s.name}, ${s.maxKw} kW, ${STATUS_LABEL[s.demoStatus]}`}>
          <Popup>
            <p style={{ fontWeight: 700, margin: 0 }}>{s.name}</p>
            <p style={{ margin: '4px 0 0', color: '#9AAFC5', fontSize: 12 }}>
              {s.operator} · {s.maxKw} kW · {s.connectors.join(', ')}
              <br />
              {STATUS_LABEL[s.demoStatus]} · {s.pricePerKwh.toFixed(2).replace('.', ',')} ₺/kWh (örnek)
            </p>
            <a href={`/rezervasyon?istasyon=${s.id}`} style={{ display: 'inline-block', marginTop: 8, color: '#00E5D4', fontWeight: 600 }}>
              Rezervasyon demo →
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
