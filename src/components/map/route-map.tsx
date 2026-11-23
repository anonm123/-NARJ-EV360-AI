'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { LngLat } from '@/lib/routing/geometry';

export interface RouteMapStop {
  lat: number;
  lng: number;
  label: string;
}

function Fit({ coords }: { coords: LngLat[] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length) map.fitBounds(coords.map(([lng, lat]) => [lat, lng] as [number, number]), { padding: [24, 24] });
  }, [coords, map]);
  return null;
}

export default function RouteMap({ coords, stops }: { coords: LngLat[]; stops: RouteMapStop[] }) {
  const latlngs = coords.map(([lng, lat]) => [lat, lng] as [number, number]);
  return (
    <MapContainer center={[39, 35]} zoom={6} scrollWheelZoom={false} className="size-full" preferCanvas>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları &copy; <a href="https://carto.com/attributions">CARTO</a> · Rota: <a href="https://project-osrm.org">OSRM</a> · İstasyonlar: EPDK, Open Charge Map, OSM'
        subdomains="abcd"
      />
      <Fit coords={coords} />
      <Polyline positions={latlngs} pathOptions={{ color: '#00E5D4', weight: 9, opacity: 0.18 }} />
      <Polyline positions={latlngs} pathOptions={{ color: '#00B8FF', weight: 4, opacity: 0.95 }} />
      {latlngs.length > 0 && (
        <>
          <CircleMarker center={latlngs[0]} radius={8} pathOptions={{ color: '#050A12', weight: 3, fillColor: '#00B8FF', fillOpacity: 1 }}><Tooltip>Başlangıç</Tooltip></CircleMarker>
          <CircleMarker center={latlngs[latlngs.length - 1]} radius={8} pathOptions={{ color: '#050A12', weight: 3, fillColor: '#2EE6A6', fillOpacity: 1 }}><Tooltip>Varış</Tooltip></CircleMarker>
        </>
      )}
      {stops.map((s, i) => (
        <CircleMarker key={i} center={[s.lat, s.lng]} radius={10} pathOptions={{ color: '#050A12', weight: 3, fillColor: '#00E5D4', fillOpacity: 1 }}>
          <Tooltip permanent direction="top" offset={[0, -8]}>{i + 1}. {s.label}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
