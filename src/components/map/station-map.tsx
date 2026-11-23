'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import type { Feature } from 'geojson';
import type { Station } from '@/lib/stations/types';
import { isDc } from '@/lib/stations/normalize';

export interface ViewBox {
  south: number;
  west: number;
  north: number;
  east: number;
  zoom: number;
}

export const markerColor = (s: Station) => (s.maxPowerKw == null && s.connectors.length === 0 ? '#9AAFC5' : isDc(s) ? '#00E5D4' : '#00B8FF');

function ViewWatcher({ onView }: { onView: (v: ViewBox) => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const map = useMapEvents({
    moveend: () => emit(),
  });
  const emit = () => {
    if (timer.current) clearTimeout(timer.current);
    // Debounce: kullanıcı kaydırmayı bitirmeden kaynaklara istek gönderilmez
    timer.current = setTimeout(() => {
      const b = map.getBounds();
      onView({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast(), zoom: map.getZoom() });
    }, 600);
  };
  useEffect(() => {
    emit();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function FlyTo({ target }: { target: { lat: number; lng: number; zoom: number; key: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.8 });
  }, [target, map]);
  return null;
}

export default function StationMap({
  stations,
  outline,
  selectedId,
  onSelect,
  onView,
  flyTarget,
}: {
  stations: Station[];
  outline: Feature;
  selectedId: string | null;
  onSelect: (s: Station) => void;
  onView: (v: ViewBox) => void;
  flyTarget: { lat: number; lng: number; zoom: number; key: number } | null;
}) {
  return (
    <MapContainer center={[39.0, 35.2]} zoom={6} minZoom={5} maxZoom={18} scrollWheelZoom={false} className="size-full" preferCanvas>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='Harita: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları, &copy; <a href="https://carto.com/attributions">CARTO</a> · İstasyon verisi: <a href="https://openchargemap.org">Open Charge Map</a>, OpenStreetMap (ODbL)'
        subdomains="abcd"
        maxZoom={19}
      />
      <GeoJSON data={outline} style={{ color: '#00B8FF', weight: 1.2, opacity: 0.5, fill: false }} interactive={false} />
      <ViewWatcher onView={onView} />
      <FlyTo target={flyTarget} />
      {stations.map((s) => {
        const sel = s.id === selectedId;
        const c = markerColor(s);
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={sel ? 11 : s.maxPowerKw && s.maxPowerKw >= 100 ? 8 : 6}
            pathOptions={{ color: '#050A12', weight: 2, fillColor: c, fillOpacity: 0.95 }}
            eventHandlers={{ click: () => onSelect(s) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {s.name ?? 'İsimsiz istasyon'} · {s.maxPowerKw != null ? `${s.maxPowerKw} kW` : 'güç bilinmiyor'}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
